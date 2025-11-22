import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo, Link as LinkIcon, Image as ImageIcon, Code, Heading1, Heading2, } from 'lucide-react';
import UrlInputModal from './UrlInputModal';
export default function RichTextEditor({ content, onChange }) {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
                validate: (href) => /^https?:\/\//.test(href),
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto',
                    loading: 'lazy',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] p-4',
            },
        },
    });
    if (!editor) {
        return null;
    }
    const handleAddLink = (url) => {
        editor.chain().focus().setLink({ href: url }).run();
    };
    const handleAddImage = (url) => {
        editor.chain().focus().setImage({ src: url, alt: 'Content image' }).run();
    };
    return (_jsxs("div", { className: "border border-gray-300 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gray-50 border-b border-gray-300 p-2", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleBold().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`, children: _jsx(Bold, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleItalic().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`, children: _jsx(Italic, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-px h-6 bg-gray-300" }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`, children: _jsx(Heading1, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`, children: _jsx(Heading2, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-px h-6 bg-gray-300" }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleBulletList().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`, children: _jsx(List, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleOrderedList().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`, children: _jsx(ListOrdered, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleBlockquote().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`, children: _jsx(Quote, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().toggleCode().run(), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('code') ? 'bg-gray-200' : ''}`, children: _jsx(Code, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-px h-6 bg-gray-300" }), _jsx("button", { type: "button", onClick: () => setShowLinkModal(true), className: `p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`, children: _jsx(LinkIcon, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => setShowImageModal(true), className: "p-2 rounded hover:bg-gray-200", children: _jsx(ImageIcon, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-px h-6 bg-gray-300" }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().undo().run(), className: "p-2 rounded hover:bg-gray-200", children: _jsx(Undo, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => editor.chain().focus().redo().run(), className: "p-2 rounded hover:bg-gray-200", children: _jsx(Redo, { className: "h-4 w-4" }) })] }) }), _jsx(EditorContent, { editor: editor, className: "tiptap-editor" }), _jsx(UrlInputModal, { isOpen: showLinkModal, onClose: () => setShowLinkModal(false), onSubmit: handleAddLink, title: "Add Link", placeholder: "https://example.com" }), _jsx(UrlInputModal, { isOpen: showImageModal, onClose: () => setShowImageModal(false), onSubmit: handleAddImage, title: "Add Image", placeholder: "https://example.com/image.jpg", validateImage: true })] }));
}
//# sourceMappingURL=RichTextEditor.js.map