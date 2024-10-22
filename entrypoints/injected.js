
import { isProbablyReaderable, Readability } from '@mozilla/readability';
// entrypoints/injected.js
export default defineUnlistedScript(() => {
  console.log('Script was injected!');
  
  function canBeParsed(document) {
    return isProbablyReaderable(document, {
      minContentLength: 100
    });
  }
  
  function parse(document) {
    if (!canBeParsed(document)) {
      return false;
    }
    const documentClone = document.cloneNode(true);
    const article = new Readability(documentClone).parse();
    // console.log(article.textContent) 
    return article.textContent;
  }
  const result = parse(window.document);
  return result;
});