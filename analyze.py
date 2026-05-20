import os
import json
import urllib.request

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

def main(request):
    if request.method != 'POST':
        return json.dumps({'error': 'Method not allowed'}), 405

    try:
        body = request.get_json()
    except:
        return json.dumps({'error': 'Invalid JSON'}), 400

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }
    )

    try:
        response = urllib.request.urlopen(req, timeout=30)
        result = response.read().decode()

        return json.dumps(json.loads(result)), 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    except urllib.error.HTTPError as e:
        return json.dumps({
            'error': 'OpenAI API error',
            'details': e.read().decode()
        }), e.code
    except Exception as e:
        return json.dumps({'error': str(e)}), 500
