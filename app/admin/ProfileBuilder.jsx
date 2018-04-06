import axios from "axios";
import React, {Component} from "react";
import {NonIdealState, Tree} from "@blueprintjs/core";
import ProfileEditor from "./ProfileEditor";
import SectionEditor from "./SectionEditor";
import TopicEditor from "./TopicEditor";
import CtxMenu from "./CtxMenu";

import "./ProfileBuilder.css";

class ProfileBuilder extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
      nodes: null,
      builders: null,
      currentNode: null
    };
  }

  componentDidMount() {
    axios.get("/api/internalprofile/all").then(resp => {
      const {builders, profiles} = resp.data;
      
      let nodes = profiles.map(p => ({
        id: `profile${p.id}`,
        hasCaret: true,
        label: p.slug,
        itemType: "profile",
        parent: {childNodes: []},
        data: p,
        childNodes: p.sections.map(s => ({
          id: `section${s.id}`,
          hasCaret: true,
          label: s.title,
          itemType: "section",
          data: s,
          childNodes: s.topics.map(t => ({
            id: `topic${t.id}`,
            hasCaret: false,
            label: t.title,
            itemType: "topic",
            data: t
          }))
        }))
      }));
      const parent = {childNodes: nodes};
      nodes = nodes.map(p => ({...p, 
        parent,
        childNodes: p.childNodes.map(s => ({...s, 
          parent: p,
          childNodes: s.childNodes.map(t => ({...t, 
            parent: s
          }))
        })
        )}));

      this.setState({mounted: true, nodes, builders});
    });
  }

  moveItem(n, dir) {
    console.log("move", n, dir);
  }

  addItem(n, dir) {
    console.log("add", n, dir); 
  }

  deleteItem(n) {
    console.log("delete", n);
  }

  handleNodeClick(node) {
    const {currentNode} = this.state;
    if (!currentNode) {
      node.isSelected = true;
      node.secondaryLabel = <CtxMenu node={node} moveItem={this.moveItem.bind(this)} addItem={this.addItem.bind(this)} deleteItem={this.deleteItem.bind(this)} />;
    }
    else if (node.id !== currentNode.id) {
      node.isSelected = true;
      currentNode.isSelected = false;
      node.secondaryLabel = <CtxMenu node={node} moveItem={this.moveItem.bind(this)} addItem={this.addItem.bind(this)} deleteItem={this.deleteItem.bind(this)} />;
      currentNode.secondaryLabel = null;
    }
    if (this.props.setPath) this.props.setPath(node);
    this.setState({currentNode: node});
  }
  
  handleNodeCollapse(node) {
    node.isExpanded = false;
    this.setState({nodes: this.state.nodes});
  }

  handleNodeExpand(node) {
    node.isExpanded = true;
    this.setState({nodes: this.state.nodes});
  }

  reportSave(newData) {
    /*const {currentNode} = this.state;
    if (currentNode.itemType === "island" || currentNode.itemType === "level") currentNode.label = newData.name;
    if (currentNode.itemType === "slide") currentNode.label = newData.title;
    this.setState({currentNode});*/
  }

  render() {

    const {nodes, currentNode, builders} = this.state;

    if (!nodes || !builders) return <div>Loading</div>;

    return (
      <div id="profile-builder">
        <div id="tree">
          <Tree
            onNodeClick={this.handleNodeClick.bind(this)}
            onNodeCollapse={this.handleNodeCollapse.bind(this)}
            onNodeExpand={this.handleNodeExpand.bind(this)}
            contents={nodes}
            
          />
        </div>
        <div id="item-editor">
          { currentNode
            ? currentNode.itemType === "profile"
              ? <ProfileEditor rawData={currentNode.data} builders={builders} reportSave={this.reportSave.bind(this)} />
              : currentNode.itemType === "section"
                ? <SectionEditor data={currentNode.data} reportSave={this.reportSave.bind(this)}/>
                : currentNode.itemType === "topic"
                  ? <TopicEditor data={currentNode.data} reportSave={this.reportSave.bind(this)}/>
                  : null
            : <NonIdealState title="No Profile Selected" description="Please select a Profile from the menu on the left." visual="path-search" />
          }
        </div>

      </div>
    );
  }
}

export default ProfileBuilder;
