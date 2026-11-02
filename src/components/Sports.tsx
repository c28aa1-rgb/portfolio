import { motion } from "framer-motion";
import { AddButton, E, ItemTools } from "../editor/Editable";
import { useContent } from "../editor/store";
import { inView, rise, stagger } from "../motion";
import { SectionHead } from "./SectionHead";

export function Sports() {
  const { sports } = useContent().content;
  return (
    <section className="section section--tight" id="sports" aria-labelledby="sports-title">
      <div className="wrap">
        <SectionHead id="sports-title" title="Sports" measure={`${sports.length} teams`} />
        <motion.table className="sports" variants={stagger(0.06)} {...inView}>
          <thead>
            <tr>
              <th scope="col">Sport</th>
              <th scope="col">Years</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {sports.map((_, i) => (
              <motion.tr key={i} variants={rise} className="item">
                <td className="sports__sport">
                  <E path={`sports.${i}.sport`} />
                </td>
                <td>
                  <E path={`sports.${i}.years`} />
                </td>
                <td>
                  <E path={`sports.${i}.role`} />
                  <ItemTools path="sports" index={i} count={sports.length} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
        <AddButton path="sports" item={{ sport: "TODO: Sport", years: "TODO: Years", role: "TODO: Role" }}>
          Add sport
        </AddButton>
      </div>
    </section>
  );
}
