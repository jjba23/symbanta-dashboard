;; symbanta-dashboard
;;
;; SPDX-License-Identifier: MIT
;; Copyright © Josep Bigorra <jjbigorra@gmail.com>

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
