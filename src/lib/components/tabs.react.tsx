import React, {Component, Children} from "react";

interface TabPanelProps {
    className: string;
    children?: React.ReactNode;
    index: any;
    value: any;
}

export function TabPanel(props: TabPanelProps) {
  return (
    <div
        className={props.className}
        role="tabpanel"
        hidden={props.value !== props.index}
        id={`simple-tabpanel-${props.index}`}
        aria-labelledby={`simple-tab-${props.index}`}
    >
        {props.children}
    </div>
  );
}
