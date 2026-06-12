import { prisma } from "@/lib/db";
import { requireManage } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { approveUser, setUserRole, toggleUserActive } from "@/lib/admin-actions";
import { PageHead } from "@/components/PageHead";
import { Select } from "@/components/form";

export const metadata = { title: "Users · Admin" };

export default async function AdminUsersPage() {
  const admin = await requireManage();
  const users = await prisma.user.findMany({ orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }] });

  return (
    <>
      <PageHead eyebrow="Administration" title="Users & approvals" subtitle={`${users.length} accounts`} />
      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="pa-card">
          <table className="pa-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.fullName}{u.id === admin.id && <span className="text-mute text-xs"> · you</span>}</div>
                    <div className="text-xs text-mute">{u.email}{u.affiliation ? ` · ${u.affiliation}` : ""}</div>
                    {u.credentialPath ? (
                      <a href={`/api/admin/credential/${u.id}`} target="_blank" rel="noreferrer" className="pa-pill pa-pill-info" style={{ marginTop: ".35rem", fontSize: ".68rem" }}>
                        <i className="bi bi-file-earmark-text" /> View credential
                      </a>
                    ) : (
                      <span className="text-xs text-mute" style={{ display: "block", marginTop: ".25rem", fontStyle: "italic" }}>no credential uploaded</span>
                    )}
                  </td>
                  <td>
                    <form action={setUserRole} className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <Select name="role" defaultValue={u.role} style={{ padding: ".3rem .5rem", width: "auto" }} title={ROLE_LABELS[u.role]} aria-label="Role">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </Select>
                      <button className="pa-btn pa-btn-outline" style={{ padding: ".3rem .55rem" }} title="Update role" aria-label="Update role"><i className="bi bi-check" /></button>
                    </form>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>{u.emailConfirmed ? <span style={{ color: "#1f5d3a" }}><i className="bi bi-envelope-check" /> confirmed</span> : <span className="text-mute"><i className="bi bi-envelope" /> unconfirmed</span>}</span>
                      <span>{u.isApproved ? <span style={{ color: "#1f5d3a" }}><i className="bi bi-check-circle" /> approved</span> : <span style={{ color: "#d9730d" }}><i className="bi bi-hourglass-split" /> pending</span>}</span>
                      {!u.isActive && <span style={{ color: "#8c2832" }}><i className="bi bi-slash-circle" /> deactivated</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex gap-1 justify-end flex-wrap">
                      {!u.isApproved && (
                        <form action={approveUser}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className="pa-btn pa-btn-primary" style={{ padding: ".3rem .6rem" }}><i className="bi bi-person-check" /> Approve</button>
                        </form>
                      )}
                      {u.id !== admin.id && (
                        <form action={toggleUserActive}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className="pa-btn pa-btn-outline" style={{ padding: ".3rem .6rem" }}>
                            {u.isActive ? <><i className="bi bi-slash-circle" /> Deactivate</> : <><i className="bi bi-arrow-clockwise" /> Reactivate</>}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
