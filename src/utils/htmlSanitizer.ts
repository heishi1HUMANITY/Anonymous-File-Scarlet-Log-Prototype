const ALLOWED_TAGS: string[] = [
  'b', 'i', 'u', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'span', 'ul', 'ol', 'li', 'a'
];

const ALLOWED_A_ATTRIBUTES: { [key: string]: (value: string) => boolean } = {
  'href': (value: string) => 
    value.startsWith('http://') || 
    value.startsWith('https://') || 
    value.startsWith('mailto:')
};

function processNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(true);
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (ALLOWED_TAGS.includes(tagName)) {
      const newElement = document.createElement(tagName);

      // Copy allowed attributes
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (tagName === 'a' && ALLOWED_A_ATTRIBUTES[attr.name]) {
          if (ALLOWED_A_ATTRIBUTES[attr.name](attr.value)) {
            newElement.setAttribute(attr.name, attr.value);
          }
        } else if (tagName !== 'a') {
          // For non-<a> tags, if we decide to allow other attributes,
          // they would be handled here. Currently, only <a> has specific
          // attribute whitelisting, others are stripped.
        }
      }
      
      // For <a> tags, if href was invalid and removed, or if it never existed,
      // but we still want to keep the text content, we proceed.
      // If an <a> tag has no valid href, it will be like a span.

      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        const processedChild = processNode(childNode);
        if (processedChild) {
          newElement.appendChild(processedChild);
        }
      }
      return newElement;
    } else {
      // If tag is not allowed, process its children and append them to a fragment
      // This way, content of disallowed tags is not entirely lost, only the tag itself.
      // For example, if <div><span>Allowed</span><script>alert("bad")</script></div>
      // we want to keep "Allowed".
      // However, the prompt says "Otherwise, return null (or an empty text node) 
      // to effectively remove disallowed tags and their content."
      // Re-reading: "return null (or an empty text node) to effectively remove disallowed tags AND THEIR CONTENT." (emphasis mine)
      // So, if a tag is not allowed, we return null.
      return null;
    }
  }

  return null; // Default for other node types (comments, etc.)
}

export function sanitizeHtml(htmlString: string): string {
  const convertToPlainText = (str: string): string => {
    return str.replace(/<[^>]+>/g, '');
  };

  if (typeof DOMParser === 'undefined') {
    console.warn('DOMParser not available. Falling back to plain text conversion.');
    return convertToPlainText(htmlString);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Check for parsing errors explicitly, as DOMParser might return an error document
    // instead of throwing an exception for some types of malformed HTML.
    if (doc.getElementsByTagName('parsererror').length > 0) {
        console.warn('DOMParser encountered a parsing error. Falling back to plain text conversion.');
        return convertToPlainText(htmlString);
    }
    
    // Create a new div to hold the sanitized content
    const sanitizedContainer = document.createElement('div');

    // Process each child node of the parsed body
    for (let i = 0; i < doc.body.childNodes.length; i++) {
      const node = doc.body.childNodes[i];
      const processed = processNode(node);
      if (processed) {
        sanitizedContainer.appendChild(processed);
      }
    }
    return sanitizedContainer.innerHTML;
  } catch (error) {
    console.warn('Error during DOMParser operations or sanitization. Falling back to plain text conversion.', error);
    return convertToPlainText(htmlString);
  }
}
