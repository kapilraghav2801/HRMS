import { useEffect, useState, useRef } from 'react';
import {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api';
import { useToast } from '../components/Toast';
import Modal, { ConfirmModal } from '../components/Modal';

// FastAPI validation errors return detail as an array of objects;
// extract a readable string from either format.
function getApiError(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return 'Something went wrong';
  if (Array.isArray(detail))
    return detail.map((d) => d.msg ?? String(d)).join(', ');
  return String(detail);
}

const EMPTY_FORM = {
  employee_id: '',
  name: '',
  email: '',
  department: '',
  position: '',
};

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [useCustomDept, setUseCustomDept] = useState(false);

  // Refs so fetchEmployees() always reads latest filter values
  // without needing to be recreated (which caused the crash)
  const searchRef = useRef(search);
  const deptRef = useRef(deptFilter);
  searchRef.current = search;
  deptRef.current = deptFilter;

  const fetchEmployees = () => {
    const params = {};
    if (searchRef.current) params.search = searchRef.current;
    if (deptRef.current) params.department = deptRef.current;
    return getEmployees(params).then((r) => setEmployees(r.data));
  };

  const fetchDepartments = () =>
    getDepartments().then((r) => setDepartments(r.data));

  // Initial load only
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEmployees(), fetchDepartments()])
      .catch(() => toast('Failed to load employees', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change (debounced 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees().catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [search, deptFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUseCustomDept(false);
    setShowForm(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({
      employee_id: emp.employee_id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      position: emp.position || '',
    });
    setUseCustomDept(!departments.includes(emp.department));
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.employee_id || !form.name || !form.email || !form.department) {
      toast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateEmployee(editing.id, {
          name: form.name,
          email: form.email,
          department: form.department,
          position: form.position || null,
        });
        toast('Employee updated successfully');
      } else {
        await createEmployee(form);
        toast('Employee added successfully');
      }
      // IMPORTANT: close modal BEFORE fetching to avoid setting
      // state on a component that is about to unmount
      setShowForm(false);
      setEditing(null);
      await Promise.all([fetchEmployees(), fetchDepartments()]);
    } catch (err) {
      toast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(confirmDelete.id);
      toast('Employee deleted');
      setConfirmDelete(null);
      await fetchEmployees();
    } catch {
      toast('Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className='filters'>
        <div className='search-input'>
          <svg
            className='search-icon'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z'
            />
          </svg>
          <input
            placeholder='Search by name, email or ID…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value=''>All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          className='btn btn-primary'
          onClick={openAdd}
          style={{ marginLeft: 'auto' }}
        >
          <svg
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 4v16m8-8H4'
            />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Table */}
      <div className='card'>
        {loading ? (
          <div className='spinner' />
        ) : employees.length === 0 ? (
          <div className='empty-state'>
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <p>
              No employees found.{' '}
              {!search && !deptFilter && 'Click "Add Employee" to get started.'}
            </p>
          </div>
        ) : (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          className='avatar'
                          style={{ width: 32, height: 32, fontSize: 12 }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div className='td-muted'>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          background: 'var(--bg)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {emp.employee_id}
                      </code>
                    </td>
                    <td>{emp.department}</td>
                    <td className='td-muted'>{emp.position || '—'}</td>
                    <td className='td-muted'>
                      {new Date(emp.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className='actions'>
                        <button
                          className='btn btn-ghost btn-sm'
                          onClick={() => openEdit(emp)}
                        >
                          <svg
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                            style={{ width: 14, height: 14 }}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z'
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          className='btn btn-ghost btn-sm'
                          style={{ color: 'var(--red)' }}
                          onClick={() => setConfirmDelete(emp)}
                        >
                          <svg
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                            style={{ width: 14, height: 14 }}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5'
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal
          title={editing ? 'Edit Employee' : 'Add New Employee'}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          footer={
            <>
              <button
                className='btn btn-ghost'
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button
                className='btn btn-primary'
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Employee'}
              </button>
            </>
          }
        >
          <div className='form-row'>
            <div className='form-group'>
              <label>Employee ID *</label>
              <input
                value={form.employee_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employee_id: e.target.value }))
                }
                placeholder='EMP001'
                disabled={!!editing}
              />
            </div>
            <div className='form-group'>
              <label>Full Name *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder='John Doe'
              />
            </div>
          </div>
          <div className='form-group'>
            <label>Email Address *</label>
            <input
              type='email'
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder='john@company.com'
            />
          </div>
          <div className='form-row'>
            <div className='form-group'>
              <label>Department *</label>
              {departments.length > 0 && !useCustomDept ? (
                <select
                  value={form.department}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setUseCustomDept(true);
                      setForm((f) => ({ ...f, department: '' }));
                    } else {
                      setForm((f) => ({ ...f, department: e.target.value }));
                    }
                  }}
                >
                  <option value=''>Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value='__new__'>＋ Add new department</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                    placeholder='e.g. Engineering'
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  {departments.length > 0 && (
                    <button
                      type='button'
                      className='btn btn-ghost btn-sm'
                      onClick={() => {
                        setUseCustomDept(false);
                        setForm((f) => ({ ...f, department: departments[0] }));
                      }}
                    >
                      ← Back
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className='form-group'>
              <label>Position</label>
              <input
                value={form.position}
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: e.target.value }))
                }
                placeholder='Software Developer'
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <ConfirmModal
          message={`This will permanently delete ${confirmDelete.name} and all their attendance records.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
