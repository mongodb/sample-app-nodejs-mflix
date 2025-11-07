import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Sample Mflix</h1>
        <p className={styles.description}>
          Explore movies from the sample MFlix database
        </p>
        <Link href="/movies" className={styles.button}>
          See movies
        </Link>
      </main>
    </div>
  );
}
