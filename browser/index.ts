import RevealMd from '../src'
import MakeHtml from './make-html'

const make = new MakeHtml()

new RevealMd(
  (s, ext) => make.make(s, ext),
)
