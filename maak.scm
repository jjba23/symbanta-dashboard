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
  #:export (build test deploy default))

;; ====== Maak constants ======

;; The absolute path to the directory where the main project files will be deployed.
(define deploy-dir
  "/srv/symbanta.jointhefreeworld.org")

;; ====== Maak tasks ======

(define (build)
  "Build the project."
  (nix-develop (list "bash" "-c" "'npm install && npm run build'")
               #:verbose? #t))

(define (test)
  "Run the automated test suite."
  (nix-develop (list "bash" "-c" "'npm install && npm test'")
               #:verbose? #t))

(define (default)
  "Default task to be run, list available tasks."
  (list-tasks))

(define (deploy)
  "Deploy the project, refusing to continue when the test suite fails."
  (test)
  (build)
  (delete-file-recursively (~ "~a/*" deploy-dir) #:expand? #t)
  (cp "dist/*" (~ "~a/" deploy-dir) #:expand? #t))
