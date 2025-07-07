import Prism from 'prismjs';
import './prism-dialogue';  // Import the custom language
import 'prismjs/themes/prism.css';  // Or your own theme

export const highlightDialogue = (code) => {
  return Prism.highlight(code, Prism.languages.dialogue, 'dialogue');
};
