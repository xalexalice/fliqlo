"""Package the built single-file clocks for a GitHub release or issue attachment."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

version = json.loads(Path('package.json').read_text())['version']
output = Path(f'still-clocks-v{version}.zip')
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for html in sorted(Path('dist/standalone').glob('*.html')):
        archive.write(html, html.name)
    archive.write('dist/legacy/fliqlo.html', 'fliqlo-original.html')
    archive.write('dist/standalone/THIRD_PARTY_LICENSES.txt', 'THIRD_PARTY_LICENSES.txt')
    archive.write('LICENSE', 'LICENSE.txt')
    archive.writestr('README.txt', f'Still 时刻 v{version}\n\n双击 HTML 文件，在浏览器中打开。\n新增 5 款时钟完全离线运行。\nfliqlo-original.html 是原始文件，需要联网加载样式与字体。\n收藏与画廊：https://xalexalice.github.io/fliqlo/\n源代码：https://github.com/xalexalice/fliqlo\n\n屏幕常亮与全屏依赖浏览器支持及授权。\n')
print(f'Packaged {output} ({output.stat().st_size} bytes).')
