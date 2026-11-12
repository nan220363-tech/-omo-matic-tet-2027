"""OMO Matic / Vẽ Tết Trao Xuân demo website -- pure Python, no pip required.

Start: python app.py
Visit: http://127.0.0.1:5000
"""

import base64
import binascii
import json
import mimetypes
import os
import re
import sqlite3
import struct
import uuid
import zlib
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / 'static'
INDEX = ROOT / 'templates' / 'index.html'
DATA_DIR = Path(os.environ.get('OMO_DATA_DIR', str(ROOT / 'data')))
UPLOAD_DIR = DATA_DIR / 'uploads'
DB_PATH = DATA_DIR / 'artworks.sqlite3'
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BODY = 2_800_000
MAX_PNG = 2_000_000
PNG_HEADER = b'\x89PNG\r\n\x1a\n'


def connect_db():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    return db


def initialize_database():
    with connect_db() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS artworks (
            id TEXT PRIMARY KEY,
            nickname TEXT NOT NULL,
            wish TEXT NOT NULL,
            filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        )''')


def valid_png(blob):
    """Check PNG structure, checksums and fixed drawing size without dependencies."""
    if not blob.startswith(PNG_HEADER) or len(blob) > MAX_PNG:
        return False
    offset = len(PNG_HEADER)
    got_header = False
    got_image = False
    got_end = False
    while offset + 12 <= len(blob):
        chunk_length = struct.unpack_from('>I', blob, offset)[0]
        chunk_type = blob[offset + 4:offset + 8]
        end = offset + 12 + chunk_length
        if chunk_length > MAX_PNG or end > len(blob):
            return False
        payload = blob[offset + 8:offset + 8 + chunk_length]
        crc_stored = struct.unpack_from('>I', blob, offset + 8 + chunk_length)[0]
        if zlib.crc32(chunk_type + payload) & 0xffffffff != crc_stored:
            return False
        if not got_header:
            if chunk_type != b'IHDR' or chunk_length != 13:
                return False
            width, height, bitdepth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            if (width, height) != (600, 700) or bitdepth != 8 or color not in (2, 6):
                return False
            if compression != 0 or filtering != 0 or interlace not in (0, 1):
                return False
            got_header = True
        if chunk_type == b'IDAT':
            got_image = True
        if chunk_type == b'IEND':
            got_end = (chunk_length == 0 and end == len(blob))
            break
        offset = end
    return got_header and got_image and got_end


def clean_text(value):
    return ' '.join(value.split()) if isinstance(value, str) else ''


class SiteHandler(BaseHTTPRequestHandler):
    server_version = 'MicrositePython/1.0'

    def send_bytes(self, code, data, content_type, *, cache=False):
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Cache-Control', 'public, max-age=3600' if cache else 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, code, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_bytes(code, payload, 'application/json; charset=utf-8')

    def send_file(self, filepath, cache=True):
        try:
            content = filepath.read_bytes()
        except OSError:
            self.send_json(404, {'error': 'Không tìm thấy tệp.'})
            return
        content_type = mimetypes.guess_type(str(filepath))[0] or 'application/octet-stream'
        if content_type.startswith('text/') or content_type in ('image/svg+xml', 'application/javascript'):
            content_type += '; charset=utf-8'
        self.send_bytes(200, content, content_type, cache=cache)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/':
            self.send_file(INDEX, cache=False)
        elif path == '/health':
            self.send_json(200, {'status': 'ok'})
        elif path == '/api/artworks':
            with connect_db() as db:
                records = db.execute(
                    'SELECT id, nickname, wish, filename, created_at '
                    'FROM artworks ORDER BY created_at DESC LIMIT 30'
                ).fetchall()
            self.send_json(200, {'artworks': [
                {'id': row['id'], 'nickname': row['nickname'], 'wish': row['wish'],
                 'image_url': '/uploads/' + row['filename'], 'created_at': row['created_at']}
                for row in records
            ]})
        elif path.startswith('/uploads/'):
            filename = path[len('/uploads/'):]
            if not re.fullmatch(r'[a-f0-9]{32}\.png', filename):
                self.send_json(404, {'error': 'Không tìm thấy ảnh.'})
            else:
                self.send_file(UPLOAD_DIR / filename)
        elif path.startswith('/static/'):
            filename = path[len('/static/'):]
            target = (STATIC / filename).resolve()
            if not target.is_relative_to(STATIC) or not target.is_file():
                self.send_json(404, {'error': 'Không tìm thấy tệp.'})
            else:
                self.send_file(target)
        else:
            self.send_json(404, {'error': 'Đường dẫn không tồn tại.'})

    def do_POST(self):
        if urlsplit(self.path).path != '/api/artworks':
            return self.send_json(404, {'error': 'Đường dẫn không tồn tại.'})
        try:
            content_length = int(self.headers.get('Content-Length', '-1'))
        except ValueError:
            return self.send_json(400, {'error': 'Content-Length không hợp lệ.'})
        if not 0 < content_length <= MAX_BODY:
            return self.send_json(413, {'error': 'Dữ liệu quá lớn hoặc không hợp lệ.'})
        if not self.headers.get('Content-Type', '').startswith('application/json'):
            return self.send_json(415, {'error': 'Vui lòng gửi dữ liệu JSON.'})
        try:
            data = json.loads(self.rfile.read(content_length))
        except (ValueError, UnicodeDecodeError):
            return self.send_json(400, {'error': 'JSON không hợp lệ.'})
        if not isinstance(data, dict):
            return self.send_json(400, {'error': 'Dữ liệu không hợp lệ.'})
        nickname = clean_text(data.get('nickname'))
        wish = clean_text(data.get('wish'))
        picture = data.get('image')
        if not 2 <= len(nickname) <= 32:
            return self.send_json(400, {'error': 'Tên hiển thị cần từ 2 đến 32 ký tự.'})
        if len(wish) > 150:
            return self.send_json(400, {'error': 'Lời chúc không được quá 150 ký tự.'})
        if data.get('consent') is not True:
            return self.send_json(400, {'error': 'Bạn cần đồng ý công khai tranh và tên hiển thị.'})
        if not isinstance(picture, str) or not picture.startswith('data:image/png;base64,'):
            return self.send_json(400, {'error': 'Ảnh phải có định dạng PNG.'})
        try:
            raw = base64.b64decode(picture.split(',', 1)[1], validate=True)
        except (ValueError, binascii.Error):
            return self.send_json(400, {'error': 'Dữ liệu ảnh bị lỗi.'})
        if not valid_png(raw):
            return self.send_json(400, {'error': 'Ảnh PNG không hợp lệ, quá lớn hoặc sai kích thước.'})

        artwork_id = uuid.uuid4().hex
        filename = artwork_id + '.png'
        target = UPLOAD_DIR / filename
        try:
            target.write_bytes(raw)
            with connect_db() as db:
                db.execute('INSERT INTO artworks (id, nickname, wish, filename, created_at) '
                           'VALUES (?, ?, ?, ?, ?)',
                           (artwork_id, nickname, wish, filename, datetime.now(timezone.utc).isoformat()))
        except OSError:
            target.unlink(missing_ok=True)
            return self.send_json(500, {'error': 'Không thể lưu ảnh. Vui lòng thử lại.'})
        except sqlite3.Error:
            target.unlink(missing_ok=True)
            return self.send_json(500, {'error': 'Không thể lưu bài gửi. Vui lòng thử lại.'})
        self.send_json(201, {'success': True, 'id': artwork_id})


if __name__ == '__main__':
    initialize_database()
    port = int(os.environ.get('PORT', '5000'))
    server = ThreadingHTTPServer(('0.0.0.0', port), SiteHandler)
    print(f'Website đang chạy tại http://127.0.0.1:{port}', flush=True)
    print('Nhấn Ctrl+C để tắt server.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
else:
    initialize_database()
