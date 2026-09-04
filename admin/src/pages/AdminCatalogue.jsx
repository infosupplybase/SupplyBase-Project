import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';

const INPUT_TYPES = ['SINGLE', 'MULTI', 'TEXT', 'NUMBER', 'FILE'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const needsOptions = (inputType) => inputType === 'SINGLE' || inputType === 'MULTI';

const emptyCategoryForm = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  icon: '',
  heroImage: '',
  visitFee: '',
  sortOrder: '',
};

const emptyOption = () => ({ value: '', label: '', hint: '', group: '' });

const emptyQuestionForm = {
  stepNo: '',
  questionKey: '',
  questionText: '',
  inputType: 'SINGLE',
  required: true,
  options: [emptyOption()],
};

/**
 * Categories power the site's service picker; questions power the booking
 * wizard steps asked for that category. One page: a category table, a
 * drawer to view/edit a category (with its active toggle and question
 * list nested inside), and a second drawer — stacked on top when open —
 * for adding or editing one question.
 */
export default function AdminCatalogue() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCategoryForm);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState(emptyCategoryForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editSaveError, setEditSaveError] = useState('');
  const [toggling, setToggling] = useState(false);

  const [questions, setQuestions] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionMode, setQuestionMode] = useState('new');
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionSaveError, setQuestionSaveError] = useState('');

  const loadCategories = useCallback(() => {
    setLoading(true);
    setError('');
    api.admin.catalogue.categories
      .list()
      .then(setCategories)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  const loadQuestions = (slug) => {
    setQuestionsLoading(true);
    setQuestionsError('');
    api.admin.catalogue.questions
      .list(slug)
      .then(setQuestions)
      .catch((err) => setQuestionsError(friendlyError(err)))
      .finally(() => setQuestionsLoading(false));
  };

  /* ------------------------------------------------------------- create */

  const openCreate = () => {
    setCreateForm(emptyCategoryForm);
    setCreateError('');
    setCreating(true);
  };

  const updateCreate = (field) => (e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const slug = createForm.slug.trim();
    if (!slug || !createForm.name.trim()) {
      setCreateError('Slug and name are both required.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setCreateError('Slug can only contain lowercase letters, numbers and hyphens.');
      return;
    }
    setCreateSaving(true);
    setCreateError('');
    try {
      const payload = {
        slug,
        name: createForm.name.trim(),
        tagline: createForm.tagline.trim() || undefined,
        description: createForm.description.trim() || undefined,
        icon: createForm.icon.trim() || undefined,
        heroImage: createForm.heroImage.trim() || undefined,
        visitFee: createForm.visitFee === '' ? undefined : Number(createForm.visitFee),
        sortOrder: createForm.sortOrder === '' ? undefined : Number(createForm.sortOrder),
      };
      await api.admin.catalogue.categories.create(payload);
      setCreating(false);
      loadCategories();
    } catch (err) {
      if (err && err.fieldErrors) setCreateError(Object.values(err.fieldErrors)[0] || friendlyError(err));
      else setCreateError(friendlyError(err));
    } finally {
      setCreateSaving(false);
    }
  };

  /* ----------------------------------------------------------- view/edit */

  const openRow = (category) => {
    setSelected(category);
    setEditForm({
      slug: category.slug,
      name: category.name || '',
      tagline: category.tagline || '',
      description: category.description || '',
      icon: category.icon || '',
      heroImage: category.heroImage || '',
      visitFee: category.visitFee ?? '',
      sortOrder: category.sortOrder ?? '',
    });
    setEditSaveError('');
    setQuestions(null);
    setQuestionsError('');
    loadQuestions(category.slug);
  };

  const closeDrawer = () => {
    setSelected(null);
    setQuestions(null);
  };

  const updateEdit = (field) => (e) => setEditForm((f) => ({ ...f, [field]: e.target.value }));

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditSaveError('Please give the category a name.');
      return;
    }
    setEditSaving(true);
    setEditSaveError('');
    try {
      const payload = {
        name: editForm.name.trim(),
        tagline: editForm.tagline.trim() || undefined,
        description: editForm.description.trim() || undefined,
        icon: editForm.icon.trim() || undefined,
        heroImage: editForm.heroImage.trim() || undefined,
        visitFee: editForm.visitFee === '' ? undefined : Number(editForm.visitFee),
        sortOrder: editForm.sortOrder === '' ? undefined : Number(editForm.sortOrder),
      };
      const updated = await api.admin.catalogue.categories.update(selected.slug, payload);
      setSelected(updated);
      loadCategories();
    } catch (err) {
      if (err && err.fieldErrors) setEditSaveError(Object.values(err.fieldErrors)[0] || friendlyError(err));
      else setEditSaveError(friendlyError(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setToggling(true);
    setEditSaveError('');
    try {
      const updated = await api.admin.catalogue.categories.setActive(selected.slug, !selected.active);
      setSelected(updated);
      loadCategories();
    } catch (err) {
      setEditSaveError(friendlyError(err));
    } finally {
      setToggling(false);
    }
  };

  /* ------------------------------------------------------------ question */

  const openNewQuestion = () => {
    const nextStep = questions && questions.length ? Math.max(...questions.map((q) => q.stepNo)) + 1 : 1;
    setQuestionMode('new');
    setQuestionForm({ ...emptyQuestionForm, stepNo: nextStep });
    setQuestionSaveError('');
    setQuestionOpen(true);
  };

  const openEditQuestion = (q) => {
    setQuestionMode('edit');
    setQuestionForm({
      stepNo: q.stepNo,
      questionKey: q.key,
      questionText: q.text,
      inputType: q.inputType,
      required: q.required,
      options:
        q.options && q.options.length
          ? q.options.map((o) => ({
              value: o.value || '',
              label: o.label || '',
              hint: o.hint || '',
              group: o.group || '',
            }))
          : [emptyOption()],
    });
    setQuestionSaveError('');
    setQuestionOpen(true);
  };

  const updateQuestion = (field) => (e) => setQuestionForm((f) => ({ ...f, [field]: e.target.value }));

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setQuestionForm((f) => ({
      ...f,
      inputType: value,
      options: needsOptions(value) && f.options.length === 0 ? [emptyOption()] : f.options,
    }));
  };

  const updateOption = (idx, field) => (e) => {
    const value = e.target.value;
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
    }));
  };

  const addOption = () => setQuestionForm((f) => ({ ...f, options: [...f.options, emptyOption()] }));

  const removeOption = (idx) =>
    setQuestionForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

  const handleQuestionSave = async (e) => {
    e.preventDefault();
    const questionKey = questionForm.questionKey.trim();
    const questionText = questionForm.questionText.trim();
    if (!questionKey || !questionText || questionForm.stepNo === '') {
      setQuestionSaveError('Step number, key and question text are all required.');
      return;
    }

    let options = null;
    if (needsOptions(questionForm.inputType)) {
      const cleaned = questionForm.options
        .map((o) => ({
          value: o.value.trim(),
          label: o.label.trim(),
          hint: o.hint.trim() || undefined,
          group: o.group.trim() || undefined,
        }))
        .filter((o) => o.value || o.label);
      if (!cleaned.length) {
        setQuestionSaveError('Add at least one option for a single/multi-choice question.');
        return;
      }
      if (cleaned.some((o) => !o.value || !o.label)) {
        setQuestionSaveError('Every option needs both a value and a label.');
        return;
      }
      options = cleaned;
    }

    setQuestionSaving(true);
    setQuestionSaveError('');
    try {
      const payload = {
        stepNo: Number(questionForm.stepNo),
        questionKey,
        questionText,
        inputType: questionForm.inputType,
        required: questionForm.required,
        options,
      };
      if (questionMode === 'new') {
        await api.admin.catalogue.questions.create(selected.slug, payload);
      } else {
        await api.admin.catalogue.questions.update(selected.slug, questionKey, payload);
      }
      setQuestionOpen(false);
      loadQuestions(selected.slug);
    } catch (err) {
      if (err && err.fieldErrors) setQuestionSaveError(Object.values(err.fieldErrors)[0] || friendlyError(err));
      else setQuestionSaveError(friendlyError(err));
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeactivateQuestion = async (q) => {
    if (!window.confirm(`Deactivate "${q.text}"? It can be recreated later if it's needed again.`)) return;
    setQuestionsError('');
    try {
      await api.admin.catalogue.questions.remove(selected.slug, q.key);
      loadQuestions(selected.slug);
    } catch (err) {
      setQuestionsError(friendlyError(err));
    }
  };

  const sortedQuestions = questions ? [...questions].sort((a, b) => a.stepNo - b.stepNo) : [];

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>CATALOGUE</h1>
          <p>Service categories, and the questions each asks in the booking wizard.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Icon name="plus" size={16} />
          NEW CATEGORY
        </button>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Name</th>
              <th>Visit fee</th>
              <th>Sort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : sortedCategories.length ? (
              sortedCategories.map((category) => (
                <tr key={category.slug} className="admin-table-row" onClick={() => openRow(category)}>
                  <td>{category.slug}</td>
                  <td>
                    {category.name}
                    {category.tagline && (
                      <>
                        <br />
                        <span className="admin-table-sub">{category.tagline}</span>
                      </>
                    )}
                  </td>
                  <td>{category.visitFeeDisplay || '—'}</td>
                  <td>{category.sortOrder ?? '—'}</td>
                  <td>
                    <StatusBadge tone={category.active ? 'success' : 'neutral'}>
                      {category.active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------- category drawer */}
      <Drawer open={Boolean(selected)} onClose={closeDrawer} title={selected ? selected.name : ''}>
        {selected && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <StatusBadge tone={selected.active ? 'success' : 'neutral'}>
                {selected.active ? 'Active' : 'Inactive'}
              </StatusBadge>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleToggleActive}
                disabled={toggling}
              >
                {toggling ? 'SAVING…' : selected.active ? 'DEACTIVATE' : 'ACTIVATE'}
              </button>
            </div>

            <form onSubmit={handleEditSave}>
              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="cat-slug">Slug</label>
                <input id="cat-slug" type="text" value={editForm.slug} disabled />
                <span className="field-hint">Slugs can&rsquo;t be changed after a category is created.</span>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="cat-name">
                  Name <span className="req">*</span>
                </label>
                <input id="cat-name" type="text" value={editForm.name} onChange={updateEdit('name')} />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="cat-tagline">Tagline</label>
                <input id="cat-tagline" type="text" value={editForm.tagline} onChange={updateEdit('tagline')} />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="cat-desc">Description</label>
                <textarea id="cat-desc" rows={3} value={editForm.description} onChange={updateEdit('description')} />
              </div>

              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label htmlFor="cat-icon">Icon</label>
                  <input
                    id="cat-icon"
                    type="text"
                    value={editForm.icon}
                    onChange={updateEdit('icon')}
                    placeholder="Icon key, e.g. building"
                  />
                </div>
                <div className="field">
                  <label htmlFor="cat-hero">Hero image URL</label>
                  <input id="cat-hero" type="text" value={editForm.heroImage} onChange={updateEdit('heroImage')} />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label htmlFor="cat-fee">Visit fee (₹)</label>
                  <input
                    id="cat-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.visitFee}
                    onChange={updateEdit('visitFee')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cat-sort">Sort order</label>
                  <input id="cat-sort" type="number" value={editForm.sortOrder} onChange={updateEdit('sortOrder')} />
                </div>
              </div>

              {editSaveError && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{editSaveError}</span>
                </div>
              )}

              <button type="submit" className="btn btn-dark btn-block" disabled={editSaving}>
                {editSaving ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </form>

            <div className="admin-header" style={{ marginTop: 32, marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>QUESTIONS</h2>
                <p>Asked in the booking wizard for this category, in step order.</p>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={openNewQuestion}>
                <Icon name="plus" size={16} />
                ADD
              </button>
            </div>

            {questionsError && (
              <div role="alert" className="alert alert-error">
                <Icon name="info" size={18} />
                <span>{questionsError}</span>
              </div>
            )}

            {questionsLoading ? (
              <p style={{ color: 'var(--ink-muted)' }}>Loading questions…</p>
            ) : sortedQuestions.length ? (
              <div>
                {sortedQuestions.map((q) => (
                  <div
                    key={q.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                      padding: '14px 16px',
                      marginBottom: 10,
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: 'var(--gold-deep)',
                        }}
                      >
                        STEP {q.stepNo} · {q.key}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', margin: '2px 0' }}>{q.text}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                        {label(q.inputType)} · {q.required ? 'Required' : 'Optional'}
                        {needsOptions(q.inputType)
                          ? ` · ${q.options.length} option${q.options.length === 1 ? '' : 's'}`
                          : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEditQuestion(q)}>
                        EDIT
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDeactivateQuestion(q)}
                      >
                        DEACTIVATE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--ink-muted)' }}>No questions yet for this category.</p>
            )}
          </>
        )}
      </Drawer>

      {/* --------------------------------------------------- new category drawer */}
      <Drawer open={creating} onClose={() => setCreating(false)} title="New category">
        <form onSubmit={handleCreate}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="ncat-slug">
              Slug <span className="req">*</span>
            </label>
            <input
              id="ncat-slug"
              type="text"
              value={createForm.slug}
              onChange={updateCreate('slug')}
              placeholder="e.g. interior-design"
            />
            <span className="field-hint">Lowercase letters, numbers and hyphens only. Can&rsquo;t be changed later.</span>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="ncat-name">
              Name <span className="req">*</span>
            </label>
            <input id="ncat-name" type="text" value={createForm.name} onChange={updateCreate('name')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="ncat-tagline">Tagline</label>
            <input id="ncat-tagline" type="text" value={createForm.tagline} onChange={updateCreate('tagline')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="ncat-desc">Description</label>
            <textarea id="ncat-desc" rows={3} value={createForm.description} onChange={updateCreate('description')} />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="ncat-icon">Icon</label>
              <input
                id="ncat-icon"
                type="text"
                value={createForm.icon}
                onChange={updateCreate('icon')}
                placeholder="Icon key, e.g. building"
              />
            </div>
            <div className="field">
              <label htmlFor="ncat-hero">Hero image URL</label>
              <input id="ncat-hero" type="text" value={createForm.heroImage} onChange={updateCreate('heroImage')} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="ncat-fee">Visit fee (₹)</label>
              <input
                id="ncat-fee"
                type="number"
                min="0"
                step="0.01"
                value={createForm.visitFee}
                onChange={updateCreate('visitFee')}
              />
            </div>
            <div className="field">
              <label htmlFor="ncat-sort">Sort order</label>
              <input id="ncat-sort" type="number" value={createForm.sortOrder} onChange={updateCreate('sortOrder')} />
            </div>
          </div>

          {createError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{createError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block" disabled={createSaving}>
            {createSaving ? 'CREATING…' : 'CREATE CATEGORY'}
          </button>
        </form>
      </Drawer>

      {/* ----------------------------------------------------- question drawer */}
      <Drawer
        open={questionOpen}
        onClose={() => setQuestionOpen(false)}
        title={questionMode === 'new' ? 'New question' : `Edit question — ${questionForm.questionKey}`}
      >
        <form onSubmit={handleQuestionSave}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="q-step">
                Step number <span className="req">*</span>
              </label>
              <input id="q-step" type="number" min="1" value={questionForm.stepNo} onChange={updateQuestion('stepNo')} />
            </div>
            <div className="field">
              <label htmlFor="q-key">
                Key <span className="req">*</span>
              </label>
              <input
                id="q-key"
                type="text"
                value={questionForm.questionKey}
                onChange={updateQuestion('questionKey')}
                disabled={questionMode === 'edit'}
                placeholder="e.g. property_type"
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="q-text">
              Question text <span className="req">*</span>
            </label>
            <textarea id="q-text" rows={2} value={questionForm.questionText} onChange={updateQuestion('questionText')} />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="q-type">Input type</label>
              <select id="q-type" value={questionForm.inputType} onChange={handleTypeChange}>
                {INPUT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {label(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-required">Required</label>
              <select
                id="q-required"
                value={questionForm.required ? 'yes' : 'no'}
                onChange={(e) => setQuestionForm((f) => ({ ...f, required: e.target.value === 'yes' }))}
              >
                <option value="yes">Required</option>
                <option value="no">Optional</option>
              </select>
            </div>
          </div>

          {needsOptions(questionForm.inputType) && (
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
                Options <span className="req">*</span>
              </label>
              {questionForm.options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="form-grid" style={{ marginBottom: 10 }}>
                    <div className="field">
                      <label htmlFor={`opt-value-${idx}`}>Value</label>
                      <input
                        id={`opt-value-${idx}`}
                        type="text"
                        value={opt.value}
                        onChange={updateOption(idx, 'value')}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`opt-label-${idx}`}>Label</label>
                      <input
                        id={`opt-label-${idx}`}
                        type="text"
                        value={opt.label}
                        onChange={updateOption(idx, 'label')}
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ marginBottom: 10 }}>
                    <div className="field">
                      <label htmlFor={`opt-hint-${idx}`}>Hint (optional)</label>
                      <input id={`opt-hint-${idx}`} type="text" value={opt.hint} onChange={updateOption(idx, 'hint')} />
                    </div>
                    <div className="field">
                      <label htmlFor={`opt-group-${idx}`}>Group (optional)</label>
                      <input
                        id={`opt-group-${idx}`}
                        type="text"
                        value={opt.group}
                        onChange={updateOption(idx, 'group')}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => removeOption(idx)}
                    disabled={questionForm.options.length <= 1}
                  >
                    REMOVE OPTION
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addOption}>
                <Icon name="plus" size={14} />
                ADD OPTION
              </button>
            </div>
          )}

          {questionSaveError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{questionSaveError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block" disabled={questionSaving}>
            {questionSaving ? 'SAVING…' : 'SAVE QUESTION'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
