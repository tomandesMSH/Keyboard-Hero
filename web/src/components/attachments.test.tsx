import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { InfoTip } from './ui/InfoTip'
import { AttachmentField } from './classrooms/AttachmentField'
import { AttachmentLink } from './lessons/AttachmentLink'

// The download link signs its URL through Supabase; no backend in tests.
vi.mock('../lib/data/classrooms', () => ({
  fetchAttachmentDownloadUrl: vi.fn(async () => 'https://example.test/signed'),
}))

describe('InfoTip', () => {
  it('opens on click and closes on Escape without reaching the dialog around it', () => {
    const onDialogKey = vi.fn()
    render(
      <div onKeyDown={onDialogKey}>
        <InfoTip label="Vysvětlení">Text vysvětlení</InfoTip>
      </div>,
    )
    expect(screen.queryByText('Text vysvětlení')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Vysvětlení' }))
    expect(screen.getByText('Text vysvětlení')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Vysvětlení' }), { key: 'Escape' })
    expect(screen.queryByText('Text vysvětlení')).toBeNull()
    expect(onDialogKey).not.toHaveBeenCalled()
  })

  it('closes on a click elsewhere', () => {
    render(
      <>
        <InfoTip label="Vysvětlení">Text vysvětlení</InfoTip>
        <p>jinde</p>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Vysvětlení' }))
    fireEvent.pointerDown(screen.getByText('jinde'))
    expect(screen.queryByText('Text vysvětlení')).toBeNull()
  })
})

function Field() {
  const [file, setFile] = useState<File | null>(null)
  return <AttachmentField file={file} onChange={setFile} />
}

function choose(name: string, size = 100) {
  const input = document.querySelector('input[type=file]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File(['x'.repeat(size)], name)] } })
}

describe('AttachmentField', () => {
  it('is optional and explains itself behind the "i"', () => {
    render(<Field />)
    expect(screen.getByText(/nepovinné/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Co je soubor pro Keyboard Utils' }))
    expect(screen.getByText(/MusicXML/, { selector: 'b' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Keyboard Utils' })).toHaveAttribute('href', 'https://github.com/tomandesMSH/Keyboard-Utils')
  })

  it('takes a MIDI file and can drop it again', () => {
    render(<Field />)
    choose('Óda na radost.mid')
    expect(screen.getByText('Óda na radost.mid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Odebrat' }))
    expect(screen.queryByText('Óda na radost.mid')).toBeNull()
  })

  it('turns away other files', () => {
    render(<Field />)
    choose('noty.pdf')
    expect(screen.queryByText('noty.pdf')).toBeNull()
    expect(screen.getByText(/jen soubor MIDI/)).toBeInTheDocument()
  })
})

describe('AttachmentLink', () => {
  it('shows nothing without a file', () => {
    const { container } = render(<AttachmentLink assignment={{ attachment_path: null, attachment_name: null }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('offers the file and tells the student what to do with it', () => {
    render(<AttachmentLink assignment={{ attachment_path: 'a/oda.mid', attachment_name: 'Óda na radost.mid' }} />)
    expect(screen.getByRole('button', { name: /Óda na radost\.mid/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Co s tímhle souborem' }))
    expect(screen.getByText(/Učitel ti k úkolu přiložil noty/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Stáhnout Keyboard Utils' })).toHaveAttribute(
      'href',
      'https://github.com/tomandesMSH/Keyboard-Utils/releases/latest',
    )
  })

  it('tells the teacher less - they attached it', () => {
    render(<AttachmentLink assignment={{ attachment_path: 'a/oda.mid', attachment_name: 'oda.mid' }} forTeacher />)
    fireEvent.click(screen.getByRole('button', { name: 'Co s tímhle souborem' }))
    expect(screen.getByText(/jsi k úkolu přiložil/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Stáhnout Keyboard Utils' })).toBeNull()
  })
})
