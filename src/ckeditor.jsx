'use strict';

class CKEditor extends React.Component {
  render() {
    return <textarea ref="ck" className="ckeditorContainer" />;
  }
  componentDidMount() {
    this.reset(this.props.initial);
  }
  componentWillUnmount() {
    if(this.ck) { this.ck.destroy(); }
  }
  getSiteUrl() {
    return 'http://' + this.props.config.siteUrl;
  }
  toHtml(source) {
    return (source
      .split(/{{\s*site\.base_url\s*}}/)
      .join(this.getSiteUrl())
    );
  }
  fromHtml(html) {
    return (html
      .split(this.getSiteUrl())
      .join('{{ site.base_url }}')
    );
  }
  reset(content) {
    if(this.ck) { this.ck.destroy(); }
    var node = React.findDOMNode(this.refs.ck);
    $(node).text(this.toHtml(content));

    var imageBrowserUrl = window.location.href
      + '&ckImageBrowser=on'
      + '&siteUrl=' + encodeURIComponent(this.getSiteUrl());
    var options = {
      allowedContent: true,
      filebrowserImageBrowseUrl: imageBrowserUrl,
      toolbar: [
        {name: 'styles', items: ['Format']},
        {name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike']},
        {name: 'paragraph', items: ['NumberedList', 'BulletedList', 'Indent', 'Outdent', '-', 'Blockquote']},
        {name: 'table', items: ['Table', 'Image']},
        {name: 'links', items: ['Link', 'Unlink', '-', 'Anchor']},
        {name: 'subsuper', items: ['Subscript', 'Superscript']},
        {name: 'colors', items: ['TextColor', 'BGColor']},
        {name: 'tools', items: ['SpecialChar', '-', 'RemoveFormat', 'Maximize', '-', 'Source']}
      ]
    };
    this.ck = CKEDITOR.replace(node, options);
    this.ck.on('change', () => this.handleChange());
  }
  handleChange() {
    this.props.onChange(this.fromHtml(this.ck.getData()));
  }
}

class CKImageBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    var imageLi = (file) => {
      if(file.path.match(/.+\.(jp[e]?g|png|gif)$/)) {
        return (
          <li key={file.path}>
            <a onClick={this.handleClick.bind(this, file.path)}>
              {file.path}
              <br/>
              <img src={file.contentUrl()} />
            </a>
          </li>
        );
      }
    };
    if(this.state.media) {
      return (
        <ul className="list-inline ckMediaBrowser">
          {this.state.media.map(imageLi)}
        </ul>
      );
    }
    else {
      return <p>Loading files...</p>;
    }
  }
  componentDidMount() {
    var branch = this.props.repo.branch(this.props.branchName);
    branch.files()
      .then((tree) => {
        var media = tree.filter((f) => f.path.startsWith('media/'));
        this.setState({media: media});
      })
      .catch(errorHandler("loading file list"));
  }
  handleClick(path, evt) {
    evt.preventDefault();
    var site = window.opener.app.refs.site;
    var url = this.props.siteUrl + '/' + path;
    window.opener.CKEDITOR.tools.callFunction(this.props.funcNum, url);
    window.close();
  }
}
