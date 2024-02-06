export default html => {
  let gdtm = html.match(/gdtm".*?<a href=".*?">/ig) || []
  return gdtm.map(item => /href="(?<link>.*?)"/ig.exec(item).groups.link)
}
