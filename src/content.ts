// The site's words live in content.json. Edit them on the page (run `npm run dev`, then press "Edit page"),
// or edit content.json by hand. Any string that starts with "TODO:" shows as a dashed placeholder.
import data from "./content.json";

export type Link = { label: string; href: string };

export type Project = {
  id: string;
  title: string;
  kind: string;
  year: string;
  summary: string;
  details: string[];
  stack: string[];
  media: { type: "trailer" | "video" | "image" | "gallery"; src: string; poster?: string; alt: string; images?: string[] };
  links: Link[];
};

export type Build = { title: string; kind: string; note: string; photo: string | null; photoHover?: string | null; images?: string[] };

export type Hobby = { id: string; title: string; story: string; stat: { value: string; label: string }; photo: string | null };

export type Content = {
  person: { firstName: string; lastName: string; school: string; classOf: string; tagline: string; email: string; links: Link[] };
  about: { photo: string | null; bio: string[]; facts: { label: string; value: string }[] };
  projects: Project[];
  builds: Build[];
  hobbies: Hobby[];
  alsoInto: string[];
  sports: { sport: string; years: string; role: string }[];
};

export const initialContent = data as Content;
