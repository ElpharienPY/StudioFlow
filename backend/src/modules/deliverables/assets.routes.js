import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { ASSET_KINDS } from '../../utils/constants.js'
import { notFound } from '../../utils/httpError.js'
import { idParam, optional, parseBody, rules } from '../../utils/validate.js'

// No file upload: an asset is a link to the file (Drive, Frame.io, Dropbox...) plus a version number.
export const assetsRouter = Router()

const assetOut = (row) => ({
  id: row.id,
  deliverable_id: row.deliverable_id,
  uploaded_by: row.uploaded_by,
  label: row.label,
  url: row.url,
  kind: row.kind,
  version: row.version,
  created_at: row.created_at,
})

const kindFilter = (query) => parseBody({ kind: query.kind ?? 'all' }, { kind: rules.oneOf(['all', ...ASSET_KINDS]) }).kind

// GET /deliverables/:id/assets?kind=
assetsRouter.get('/deliverables/:id/assets', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id)
  const kind = kindFilter(req.query)
  const [rows] = await pool.execute(
    `SELECT * FROM assets WHERE deliverable_id = ? AND (? = 'all' OR kind = ?) ORDER BY created_at DESC, id DESC`,
    [id, kind, kind]
  )
  res.json({ assets: rows.map(assetOut) })
})

// GET /projects/:projectId/assets?kind=   (every asset of the project, for the Assets page)
assetsRouter.get('/projects/:projectId/assets', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  await access.project(req.user, projectId)
  const kind = kindFilter(req.query)
  const [rows] = await pool.execute(
    `SELECT a.* FROM assets a JOIN deliverables d ON d.id = a.deliverable_id
      WHERE d.project_id = ? AND (? = 'all' OR a.kind = ?)
      ORDER BY a.created_at DESC, a.id DESC`,
    [projectId, kind, kind]
  )
  res.json({ assets: rows.map(assetOut) })
})

// POST /deliverables/:id/assets  { label, url, kind, version? }   (editor+)
// version defaults to "next version of the same label+kind" (a re-upload of "Rough cut" becomes v2)
assetsRouter.post('/deliverables/:id/assets', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id, { min: 'editor', write: true })
  const body = parseBody(req.body, {
    label: rules.string({ max: 150 }),
    url: rules.url(),
    kind: rules.oneOf(ASSET_KINDS),
    version: optional(rules.int({ min: 1, max: 9999 })),
  })
  const [result] = await pool.execute(
    `INSERT INTO assets (deliverable_id, uploaded_by, label, url, kind, version)
     SELECT ?, ?, ?, ?, ?, COALESCE(?, COALESCE(MAX(version), 0) + 1)
       FROM assets WHERE deliverable_id = ? AND kind = ? AND label = ?`,
    [id, req.user.id, body.label, body.url, body.kind, body.version ?? null, id, body.kind, body.label]
  )
  const [rows] = await pool.execute('SELECT * FROM assets WHERE id = ?', [result.insertId])
  res.status(201).json({ asset: assetOut(rows[0]) })
})

// PATCH /assets/:id  { label?, url?, kind?, version? }   (editor+)
assetsRouter.patch('/assets/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.asset(req.user, id, { min: 'editor', write: true })
  const changes = parseBody(
    req.body,
    {
      label: rules.string({ max: 150 }),
      url: rules.url(),
      kind: rules.oneOf(ASSET_KINDS),
      version: rules.int({ min: 1, max: 9999 }),
    },
    { partial: true }
  )
  await pool.execute(`UPDATE assets SET ${Object.keys(changes).map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
    ...Object.values(changes), id,
  ])
  const [rows] = await pool.execute('SELECT * FROM assets WHERE id = ?', [id])
  if (!rows[0]) throw notFound()
  res.json({ asset: assetOut(rows[0]) })
})

// DELETE /assets/:id   (editor+)
assetsRouter.delete('/assets/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.asset(req.user, id, { min: 'editor', write: true })
  await pool.execute('DELETE FROM assets WHERE id = ?', [id])
  res.status(204).end()
})
