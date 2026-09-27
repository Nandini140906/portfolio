import { SectionHeading } from "../components/SectionHeading";
import { contact, site, whatsappUrl } from "../data/content";
import styles from "../styles/Contact.module.css";

export function Contact() {
  return (
    <section id="contact" className={`section ${styles.contact}`} aria-labelledby="contact-title">
      <div className="container">
        <div className={`panel ${styles.box}`} data-reveal>
          <SectionHeading id="contact-title" index="04" label="Contact" title={contact.heading} />
          <p className={styles.blurb}>{contact.blurb}</p>
          <a href={`mailto:${site.email}`} className={styles.email}>
            {site.email}
          </a>
          <div className={styles.actions}>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.cta} data-magnetic>
              Say hello on WhatsApp <span aria-hidden="true">→</span>
            </a>
            <ul className={styles.socials}>
              {contact.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`${styles.social} ${s.label === "LinkedIn" ? styles.socialHi : ""}`}
                    data-magnetic
                  >
                    {s.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
