import json

log_file = '/home/ubuntu/.pm2/cloudflared.log'
url = 'http://132.226.190.125/'

try:
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if 'trycloudflare.com' in line:
                for word in line.split():
                    if 'trycloudflare.com' in word:
                        clean_word = word.strip('| \t\n\r"\'')
                        if clean_word.startswith('https://'):
                            url = clean_word
except Exception as e:
    pass

data = {
    'url': url,
    'directUrl': 'http://132.226.190.125/',
    'status': 'online'
}

with open('/home/ubuntu/.pm2/opencode_url.json', 'w') as f:
    json.dump(data, f, indent=2)

print('Updated URL:', url)
