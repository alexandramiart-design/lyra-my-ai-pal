import { createRoot } from "react-dom/client";

import "./styles.css";
import { Page } from "./routes/index";

createRoot(document.getElementById("root")!).render(<Page />);