import { members, type Member } from "../data.ts";

function Avatar({ member }: { member: Member }) {
  if (member.avatar) {
    return <img className="avatar" src={import.meta.env.BASE_URL + member.avatar} alt={member.name} />;
  }
  return <div className="avatar avatar-placeholder">{member.name.charAt(0)}</div>;
}

export default function Roster() {
  return (
    <section id="roster" className="section section-alt">
      <div className="container">
        <h2>Roster</h2>
        <div className="grid">
          {members.map((m) => (
            <div className="card" key={m.name}>
              <Avatar member={m} />
              <h3>{m.name}</h3>
              <p className="muted">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
