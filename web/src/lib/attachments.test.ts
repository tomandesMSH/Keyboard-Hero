import { describe, expect, it } from 'vitest'
import { attachmentContentType, attachmentPath, MAX_ATTACHMENT_BYTES, validateAttachment } from './attachments'

describe('validateAttachment', () => {
  it('accepts MIDI and MusicXML files', () => {
    for (const name of ['skladba.mid', 'SKLADBA.MIDI', 'noty.musicxml', 'noty.mxl', 'export.xml']) {
      expect(validateAttachment({ name, size: 1000 })).toBeNull()
    }
  })

  it('rejects other files', () => {
    for (const name of ['nahravka.mp3', 'noty.pdf', 'bez-pripony', 'skladba.mid.exe']) {
      expect(validateAttachment({ name, size: 1000 })).not.toBeNull()
    }
  })

  it('rejects empty and too large files', () => {
    expect(validateAttachment({ name: 'a.mid', size: 0 })).not.toBeNull()
    expect(validateAttachment({ name: 'a.mid', size: MAX_ATTACHMENT_BYTES })).toBeNull()
    expect(validateAttachment({ name: 'a.mid', size: MAX_ATTACHMENT_BYTES + 1 })).not.toBeNull()
  })
})

describe('attachmentPath', () => {
  it('keeps the file under the assignment, with a plain ASCII name', () => {
    expect(attachmentPath('abc', 'Óda na radost – Beethoven.mid')).toBe('abc/Oda_na_radost_Beethoven.mid')
  })

  it('keeps the extension and falls back to a name when nothing is left', () => {
    expect(attachmentPath('abc', 'čšž.musicxml')).toBe('abc/csz.musicxml')
    expect(attachmentPath('abc', '★★.mxl')).toBe('abc/noty.mxl')
  })
})

describe('attachmentContentType', () => {
  it('picks the type by extension', () => {
    expect(attachmentContentType('a.mid')).toBe('audio/midi')
    expect(attachmentContentType('a.mxl')).toBe('application/vnd.recordare.musicxml')
    expect(attachmentContentType('a.musicxml')).toBe('application/vnd.recordare.musicxml+xml')
  })
})
