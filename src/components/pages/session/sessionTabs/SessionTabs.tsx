import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState, type SyntheticEvent } from "react";
import styles from "./SessionTabs.module.css";
import SessionTable from "./sessionTable/SessionTable";

const SessionTabs: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div>
      <Tabs
        className={styles.tabs}
        value={value}
        onChange={handleChange}
        centered
      >
        <Tab label="Table View" />
        <Tab label="Calendar View" />
      </Tabs>
      {value === 0 && <SessionTable></SessionTable>}
    </div>
  );
};

export default SessionTabs;
