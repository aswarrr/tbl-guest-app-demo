import { Link } from "react-router-dom";
import useTenant from "../../hooks/useTenant";

export default function AboutPage() {
  const { tenant, branches } = useTenant();
  if (!tenant || branches.length === 0) return null;
  const primary = branches[0];
  const photos = branches.flatMap((branch) => branch.photos);

  return (
    <div className="wl-page">
      <header className="wl-page-hero"><span className="wl-kicker">Since 2014</span><h1>Made in Cairo.<br />Made to be shared.</h1></header>
      <section className="wl-about-story">
        <div className="wl-about-image"><img src={photos[1]?.url || primary.coverImageUrl || ""} alt="Inside Sizzler Steak House" /></div>
        <div><span className="wl-kicker">The Sizzler story</span><h2>A place at the heart of the table.</h2><p className="wl-lead">{primary.about}</p><p>Every location brings together a comfortable room, a lively grill, and the kind of service that lets the conversation take its time.</p><Link className="wl-button wl-button-dark" to="/reserve">Reserve your table</Link></div>
      </section>
      <section className="wl-values">
        <article><span>01</span><h3>Grill craft</h3><p>Confident cooking, thoughtful details, and dishes made to arrive at the table with impact.</p></article>
        <article><span>02</span><h3>Warm hosting</h3><p>From the first welcome to the last course, hospitality stays personal and unhurried.</p></article>
        <article><span>03</span><h3>Cairo energy</h3><p>A modern steakhouse shaped by the city, its people, and its appetite for gathering.</p></article>
      </section>
    </div>
  );
}
