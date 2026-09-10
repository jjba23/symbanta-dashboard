{
  description = "Nix environment for NPM frontend development";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            npm
            prettier
            typescript-language-server
          ];

          shellHook = ''
            echo "⚡ Node.js frontend environment loaded"
            echo "Node version: $(node -v)"
            echo "NPM version:  $(npm -v)"

            # Ensure local node_modules executables are available in PATH
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    );
}
