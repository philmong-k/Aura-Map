import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './MarkdownEditor.css';

const MarkdownEditor = ({ content, onChange, readOnly = false }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '이곳에 상세 내용을 입력하세요... (마크다운 단축키 지원: # 제목, * 목록, > 인용 등)',
      }),
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // content prop이 변경되면 에디터 내용을 강제 동기화
  // (TipTap useEditor는 초기화 시에만 content를 읽으므로 수동 동기화 필수)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      // 빈 에디터(<p></p>)인데 content가 있으면 → 강제 주입
      if (content && content !== currentHTML && currentHTML === '<p></p>') {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-container">
      {!readOnly && (
        <div className="editor-toolbar">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="굵게 (Ctrl+B)"
          >
            <b>B</b>
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="기울임 (Ctrl+I)"
          >
            <i>I</i>
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            title="제목 (##)"
          >
            H2
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            title="목록 (*)"
          >
            • List
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="인용 (>)"
          >
            ” Quote
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            title="코드 블록 (```)"
          >
            {"</>"} Code
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="tiptap-content-area" />
    </div>
  );
};

export default MarkdownEditor;
