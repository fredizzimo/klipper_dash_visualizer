import React, {Component, Children} from "react";

type TabsProps = {
    children: React.ReactElement<TabProps>[]
}

type TabsState = {
    active_tab: string
}

export class Tabs extends Component<TabsProps, TabsState> {
    constructor(props: TabsProps) {
        super(props);
        this.state = {active_tab: this.props.children[0].props.label}
    }
    
    selectTab =(label: string) => {
        this.setState({active_tab: label});
    }

    render () {
        const active_tab = this.state.active_tab;
        return ( 
            <>
            <div className="tab-header">
                {this.props.children.map((child) => {
                    return (
                    <TabButton
                        label={child.props.label}
                        onClick={this.selectTab}
                        active={active_tab == child.props.label}
                    >
                        {child.props.children}
                    </TabButton>)
                })}
            </div>
            <div className="tab-content">
                {this.props.children.map((child) => {
                    return (
                        <TabContent active={active_tab == child.props.label}>
                            {child.props.children}
                        </TabContent>
                    );
                })}
            </div>
            </>
        )
    }
}

type TabProps = {
    label: string;
    children: React.ReactElement | Node;
}

export class Tab extends Component<TabProps> {
    render() {
        throw new Error("The tab component can't be renderer directly, make sure it's surrounded by a tabs component");
        return ""
    }
}

type TabButtonProps = {
    label: string;
    onClick : (label: string) => void;
    active: boolean;
}

class TabButton extends Component<TabButtonProps> {
    onClick =()=> {
        this.props.onClick(this.props.label);
    }

    render() {
        let className = "tab-button ";
        className += this.props.active ? "tab-button-active" : "tab-button-inactive"

        return (
            <div 
                onClick={this.onClick}
                className={className}
            >
                {this.props.label}
            </div>
        )
    }
}

type TabContentProps = {
    children: React.ReactElement | Node;
    active: boolean;
}

class TabContent extends Component<TabContentProps> {
    render () {
        const className = this.props.active ? "tab-content-active" : "tab-content-inactive"
        return (
            <div className={className}>
                {this.props.children}
            </div>
        );
    }

}