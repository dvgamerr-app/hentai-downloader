export default (html) => {
  let gdtm = html.match(/gdtm".*?<a href=".*?">/gi) || []
  return gdtm.map((item) => /href="(?<link>.*?)"/gi.exec(item).groups.link)
}
