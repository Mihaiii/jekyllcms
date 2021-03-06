'use strict';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {view: null};
  }
  route() {
    var query = this.props.query;
    var userPromise;
    var demo = null;

    if(query['code']) {
      return Q({
        frame: true,
        view: ()=><AuthCallback code={''+query['code']} />,
      });
    }

    if(query['demo']) {
      demo = ''+query['demo'];
      this.gitHub = new GitHub();
      userPromise = this.gitHub.user(demo);

      if(! query['repo']) {
        return userPromise
          .then((account) => {
            return Q({
              frame: true,
              view: ()=><Demo demo={demo} account={account} />,
            });
          });
      }
    }

    else {
      this.authToken = localStorage.getItem('jekyllcms-github-token');
      if(! this.authToken) {
        return Q({
          frame: true,
          view: ()=><Authorize />,
        });
      }

      this.gitHub = new GitHub(this.authToken);
      userPromise = this.gitHub.user()
        .catch((resp) => {
          if(resp.status == 401) {
            localStorage.removeItem('jekyllcms-github-token');
            window.location.href = '/';
            return Q();
          }
        })
        .catch(errorHandler("loading user information"));
    }

    return userPromise.then((user) => {
        if(query['repo']) {
          return this.gitHub.repo(''+query['repo'])
            .then((repo) => {
              var branchName;
              if(query['branch']) {
                branchName = ''+query['branch'];
              }
              else {
                branchName = (
                  repo.meta.name == repo.meta.owner.login + '.github.com' ||
                  repo.meta.name == repo.meta.owner.login + '.github.io'
                    ? 'master'
                    : 'gh-pages'
                );
              }
              if(query['ckImageBrowser']) {
                return {
                  frame: false,
                  view: ()=>
                    <CKImageBrowser
                      repo={repo}
                      branchName={branchName}
                      siteUrl={''+query['siteUrl']}
                      funcNum={+query['CKEditorFuncNum']}
                      />,
                };
              }
              else {
                return {
                  frame: true,
                  view: ()=>
                    <Site
                      ref="site"
                      repo={repo}
                      branchName={branchName}
                      demo={demo}
                      />,
                };
              }
            })
            .catch(errorHandler("loading repository"));
        }
        else {
          return {
            frame: true,
            view: ()=><Home user={user} />,
          };
        }
      });
  }
  componentWillMount() {
    this.config = this.props.config;
    this.route()
      .then((state) =>
        this.setState(state))
      .catch(errorHandler("loading main view"));
  }
  render() {
    var view = (this.state.view || (()=>null))();
    if(this.state.frame) {
      view = (
        <div>
          <Navbar auth={!! this.authToken} />
          <div className="container">
            {view}
          </div>
          <div className="modal fade" ref="modal">
            <div className="modal-dialog" ref="modalDialog">
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        {view}
        <ErrorBox ref="errorBox" />
      </div>
    );
  }
  componentDidMount() {
    $(React.findDOMNode(this.refs.modal)).on('hidden.bs.modal', () => {
      React.unmountComponentAtNode(React.findDOMNode(this.refs.modalDialog));
    });
  }
  modal(component) {
    React.render(component, React.findDOMNode(this.refs.modalDialog));
    $(React.findDOMNode(this.refs.modal)).modal();
  }
  hideModal() {
    $(React.findDOMNode(this.refs.modal)).modal('hide');
  }
  reportError(message) {
    this.refs.errorBox.report(message);
  }
}

$.get('config.json', (config) => {
  var query = parseQuery(window.location.search);
  if(config.piwik && ! query['code']) {
    trackPiwik(config.piwik);
  }
  window.app = React.render(
    <App config={config} query={query} />,
    document.querySelector('body')
  );
});
