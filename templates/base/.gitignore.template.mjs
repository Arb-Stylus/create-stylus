const contents = () => 
`node_modules

# dependencies, yarn, etc
# yarn / eslint
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
.eslintcache
.DS_Store
.vscode/*
!.vscode/settings.json
.idea
.vercel`

export default contents;
