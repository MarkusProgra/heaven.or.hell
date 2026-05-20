import os
import json
import urllib.request

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

def handler(request):
    if request.method != 'POST':
        return {'statusCode': 405, 'body': 'Method not allowed'}

    content_length = int(request.headers.get('Content-Length', 0))
    body = request.body.read(content_length)

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=body,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }
    )

    response = urllib.request.urlopen(req, timeout=30)
    result = response.read()

    return {
        'statusCode': 200,
        'body': result.decode(),
        'headers': {
            'Access-Control-Allow-Origin': '*'
        }
    }
