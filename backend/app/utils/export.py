"""Export utilities for conversations and documents."""

import json
from typing import List
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from app.models.conversation import Conversation
from app.models.message import Message


class ExportService:
    """Service for exporting data in various formats."""

    @staticmethod
    def export_conversation_json(
        conversation: Conversation,
        messages: List[Message]
    ) -> dict:
        """Export conversation as JSON."""
        return {
            "conversation": {
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "llm_provider": conversation.llm_provider,
                "llm_model": conversation.llm_model
            },
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role.value,
                    "content": msg.content,
                    "sources": msg.sources,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ],
            "metadata": {
                "exported_at": datetime.utcnow().isoformat(),
                "total_messages": len(messages),
                "format": "json",
                "version": "1.0"
            }
        }

    @staticmethod
    def export_conversation_markdown(
        conversation: Conversation,
        messages: List[Message]
    ) -> str:
        """Export conversation as Markdown."""
        lines = [
            f"# {conversation.title}",
            f"",
            f"**Created:** {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Model:** {conversation.llm_provider} / {conversation.llm_model}",
            f"**Messages:** {len(messages)}",
            f"",
            f"---",
            f""
        ]

        for msg in messages:
            role = "You" if msg.role.value == "user" else "Assistant"
            lines.append(f"## {role}")
            lines.append(f"")
            lines.append(msg.content)

            if msg.sources:
                lines.append(f"")
                lines.append(f"**Sources:** {', '.join(msg.sources)}")

            lines.append(f"")
            lines.append(f"*{msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}*")
            lines.append(f"")
            lines.append(f"---")
            lines.append(f"")

        lines.append(f"")
        lines.append(f"*Exported from Chat PDF on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}*")

        return "\n".join(lines)

    @staticmethod
    def export_conversation_pdf(
        conversation: Conversation,
        messages: List[Message]
    ) -> BytesIO:
        """Export conversation as PDF."""
        buffer = BytesIO()

        # Create PDF
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#2c3e50',
            spaceAfter=30
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor='#34495e',
            spaceBefore=20,
            spaceAfter=10
        )

        user_style = ParagraphStyle(
            'UserMessage',
            parent=styles['Normal'],
            fontSize=12,
            textColor='#2c3e50',
            leftIndent=20,
            spaceBefore=10,
            spaceAfter=10
        )

        assistant_style = ParagraphStyle(
            'AssistantMessage',
            parent=styles['Normal'],
            fontSize=12,
            textColor='#27ae60',
            leftIndent=20,
            spaceBefore=10,
            spaceAfter=10
        )

        # Build content
        content = []

        # Title
        content.append(Paragraph(conversation.title, title_style))
        content.append(Spacer(1, 0.2 * inch))

        # Metadata
        metadata_text = f"""
        <b>Created:</b> {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>Model:</b> {conversation.llm_provider} / {conversation.llm_model}<br/>
        <b>Total Messages:</b> {len(messages)}
        """
        content.append(Paragraph(metadata_text, styles['Normal']))
        content.append(Spacer(1, 0.3 * inch))

        # Messages
        for msg in messages:
            if msg.role.value == "user":
                content.append(Paragraph("<b>You:</b>", heading_style))
                content.append(Paragraph(msg.content, user_style))
            else:
                content.append(Paragraph("<b>Assistant:</b>", heading_style))
                content.append(Paragraph(msg.content, assistant_style))

                if msg.sources:
                    sources_text = f"<i>Sources: {', '.join(msg.sources)}</i>"
                    content.append(Paragraph(sources_text, styles['Italic']))

            timestamp = f"<i>{msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}</i>"
            content.append(Paragraph(timestamp, styles['Italic']))
            content.append(Spacer(1, 0.2 * inch))

        # Footer
        content.append(Spacer(1, 0.3 * inch))
        footer_text = f"<i>Exported from Chat PDF on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</i>"
        content.append(Paragraph(footer_text, styles['Italic']))

        # Build PDF
        doc.build(content)

        buffer.seek(0)
        return buffer

    @staticmethod
    def export_conversation_txt(
        conversation: Conversation,
        messages: List[Message]
    ) -> str:
        """Export conversation as plain text."""
        lines = [
            f"{'=' * 60}",
            f"  {conversation.title}",
            f"{'=' * 60}",
            f"",
            f"Created: {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Model: {conversation.llm_provider} / {conversation.llm_model}",
            f"Messages: {len(messages)}",
            f"",
            f"{'=' * 60}",
            f""
        ]

        for i, msg in enumerate(messages, 1):
            role = "YOU" if msg.role.value == "user" else "ASSISTANT"
            lines.append(f"[{i}] {role} - {msg.created_at.strftime('%H:%M:%S')}")
            lines.append(f"{'-' * 60}")
            lines.append(msg.content)

            if msg.sources:
                lines.append(f"")
                lines.append(f"Sources: {', '.join(msg.sources)}")

            lines.append(f"")
            lines.append(f"")

        lines.append(f"{'=' * 60}")
        lines.append(f"Exported from Chat PDF on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")

        return "\n".join(lines)
