;;; symbanta-dashboard

;; Copyright © Josep Bigorra <jjbigorra@gmail.com>

;; symbanta-dashboard is free software: you can redistribute it and/or modify
;; it under the terms of the GNU Affero General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.

;; symbanta-dashboard is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU Affero General Public License for more details.

;; You should have received a copy of the GNU Affero General Public License
;; along with symbanta-dashboard.  If not, see <https://www.gnu.org/licenses/>.

(define-module (maak)
  #:declarative? #t
  #:use-module (maak maak)
  #:export (build deploy default))

;; ====== Maak constants ======

;; The absolute path to the directory where the main project files will be deployed.
(define deploy-dir
  "/srv/symbanta.jointhefreeworld.org")

(define api-host
  "api.symbanta.jointhefreeworld.org")

;; ====== Maak tasks ======

(define (build)
  "Build the project."
  ($ (list "nix --extra-experimental-features 'flakes nix-command'"
           "develop -c bash -c '"
           ;; Inject the variable directly into the shell string executed inside Nix
           (~ "VITE_API_HOST=~a npm install && npm run build" api-host) "'")))

(define (default)
  "Default task to be run, list available tasks."
  ($ '("maak --list")))

(define (deploy)
  "Deploy the project."
  (build)
  (delete-file-recursively (~ "~a/*" deploy-dir))
  ($ (list "cp -rfv dist/*"
           (~ "~a/" deploy-dir))))
