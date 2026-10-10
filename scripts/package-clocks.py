"""Package the built single-file clocks for a GitHub release or issue attachment."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

version = json.loads(Path('package.json').read_text())['version']
clocks = json.loads(Path('src/data/clocks.json').read_text())
total = len(clocks)
offline = sum(clock['offline'] for clock in clocks)
output = Path(f'still-clocks-v{version}.zip')
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for html in sorted(Path('dist/standalone').glob('*.html')):
        archive.write(html, html.name)
    archive.write('dist/legacy/fliqlo.html', 'fliqlo-original.html')
    archive.write('dist/standalone/THIRD_PARTY_LICENSES.txt', 'THIRD_PARTY_LICENSES.txt')
    archive.write('LICENSE', 'LICENSE.txt')
    archive.writestr('README.txt', f'Still 时刻 v{version}\n\n双击 HTML 文件，在浏览器中打开。\n全部 {total} 款支持中文、英语、日语、韩语、法语、德语、西班牙语。\n空闲 3 秒自动隐藏标题和工具栏；移动鼠标、触摸或键盘操作可唤回。\n点击全屏按钮或按 F 进入、退出全屏。\n全部 {total} 款提供“背景”按钮，可选择本机图片或浏览器支持的 MP4 / WebM 视频。视频静音循环播放；可恢复默认背景。\n文件不会上传或保存，刷新或重新打开后需重新选择。\n{offline} 款时钟完全离线运行，所需字体、样式与脚本均内嵌。\nfliqlo.html 是原版的增强副本，增加背景功能，需要联网加载样式与字体。\nfliqlo-original.html 是原始文件，需要联网加载样式与字体。\n收藏与画廊：https://xalexalice.github.io/fliqlo/\n源代码：https://github.com/xalexalice/fliqlo\n\n屏幕常亮与全屏依赖浏览器支持及授权。\n')
print(f'Packaged {output} ({output.stat().st_size} bytes).')
