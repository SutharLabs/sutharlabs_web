import os
import re

def optimize_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Match className="... flex justify-between items-center ..."
    # taking care of either double or single quotes
    pattern = re.compile(r'className=([\'"])(.*?)\b(flex\s+justify-between\s+items-center)\b(.*?)(\1)')
    
    def repl(match):
        q = match.group(1)
        pre = match.group(2)
        core = match.group(3)
        post = match.group(4)
        
        # Skip if already has flex-col or sm:flex-row to avoid double-applying or breaking purposeful layouts
        if 'flex-col' in pre or 'flex-col' in post or 'sm:flex-row' in pre or 'sm:flex-row' in post:
            return match.group(0)
            
        return 'className=' + q + pre + 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0' + post + q

    new_content = pattern.sub(repl, content)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Optimized flex in {path}')

for root, _, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            optimize_file(os.path.join(root, file))

print('Done.')
