import React, {Component, Children} from "react";

type TabsProps = {
    children: React.ReactElement<TabProps>[]
    onTabSelected?: (label: string) => void;
}

type TabsState = {
    activeTab: string
}

export class Tabs extends Component<TabsProps, TabsState> {
    constructor(props: TabsProps) {
        super(props);
        this.state = {activeTab: this.props.children[0].props.label}
        if (this.props.onTabSelected != null) {
            this.props.onTabSelected(this.state.activeTab);
        }
    }
    
    selectTab =(label: string) => {
        this.setState({activeTab: label});
        if (this.props.onTabSelected != null) {
            this.props.onTabSelected(label);
        }
    }

    render () {
        const activeTab = this.state.activeTab;
        return ( 
            <>
            <div className="tab-header">
                {this.props.children.map((child) => {
                    return (
                    <TabButton
                        label={child.props.label}
                        onClick={this.selectTab}
                        active={activeTab == child.props.label}
                    >
                        {child.props.children}
                    </TabButton>)
                })}
            </div>
            <div className="tab-content">
                {this.props.children.map((child) => {
                    return (
                        <TabContent active={activeTab == child.props.label}>
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
        let class_name = "tab-button ";
        class_name += this.props.active ? "tab-button-active" : "tab-button-inactive"

        return (
            <div 
                onClick={this.onClick}
                className={class_name}
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