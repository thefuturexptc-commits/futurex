import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

interface Props {
  value: string
  onChange: (html: string) => void
}

export const RichTextEditor: React.FC<Props> = ({ value, onChange }) => {
  const [copyStatus, setCopyStatus] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: value || '<p></p>',
    editorProps: {
      handleDOMEvents: {
        copy: () => false,
        cut: () => false,
        paste: () => false,
        contextmenu: () => false,
      },
      attributes: {
        class: 'tiptap p-4 min-h-[200px] focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-surface select-text',
        spellcheck: 'true',
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external changes without interrupting active typing.
  useEffect(() => {
    if (!editor) return
    if (editor.isFocused) return
    if ((value || '<p></p>') !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  const copyDescription = async () => {
    const html = editor.getHTML()
    const text = editor.getText().trim()
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ])
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopyStatus('Copied')
      window.setTimeout(() => setCopyStatus(''), 1600)
    } catch {
      setCopyStatus('Select text and press Ctrl+C')
      window.setTimeout(() => setCopyStatus(''), 2400)
    }
  }

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
        : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20'
    }`

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-surface">

      <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))}>H3</button>

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))}>Underline</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))}>Strike</button>

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>1. List</button>

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))}>Quote</button>
        <button type="button" onClick={copyDescription} className="px-3 py-1.5 rounded-md text-sm bg-cyan-900/40 text-cyan-100 border border-cyan-700/50 hover:bg-cyan-800/60">
          Copy Description
        </button>
        {copyStatus && <span className="self-center text-xs font-semibold text-cyan-300">{copyStatus}</span>}

      </div>

      <EditorContent editor={editor} />

    </div>
  )
}
