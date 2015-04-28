'use strict';

var Site = React.createClass({
  getInitialState: function() {
    return {
      fileList: []
    };
  },
  render: function() {
    var editor = null;
    if(this.state.file) {
      editor = (
        <div className="editor-container row">
          <div className="editor col-sm-offset-2 col-sm-10">
            <Editor
              file={this.state.file}
              onDelete={this.handleDelete}
              onClose={this.handleClose}
              />
          </div>
        </div>
      );
    }
    return (
      <div className="site">
        <h1>{this.props.repo.meta.full_name}</h1>
        <IndexView
          fileList={this.state.fileList}
          onEdit={this.handleEdit}
          onCreate={this.handleCreate}
          />
        {editor}
      </div>
    );
  },
  componentDidMount: function() {
    this.updateFileList();
  },
  updateFileList: function() {
    this.props.branch.files()
      .then((tree) =>
        this.setState({fileList: tree.filter((i) => ! i.path.match(/^[_.]/))}))
      .catch(errorHandler("loading file list"));
  },
  handleEdit: function(file) {
    this.setState({file: file});
  },
  handleCreate: function() {
    var handleFileCreated = (path) => {
      var newFile = this.props.branch.newFile(path);
      this.setState({
        file: newFile,
        fileList: [].concat(this.state.fileList, [newFile]),
      });
    };

    app.modal(<NewFileModal onCreate={handleFileCreated} />);
  },
  handleDelete: function() {
    this.setState({file: null});
    this.updateFileList();
  },
  handleClose: function() {
    this.setState({file: null});
  }
});
