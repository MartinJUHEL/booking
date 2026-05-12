"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#181818] text-gray-200 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block"
        >
          &larr; Retour
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">
          Politique de confidentialite
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Derniere mise a jour : 13 mai 2025
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Responsable du traitement
            </h2>
            <p>
              Le site <strong>gigflow.online</strong> est edite par Gigflow.
              <br />
              Contact : <a href="mailto:contact@gigflow.online" className="text-purple-400 hover:underline">contact@gigflow.online</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Donnees collectees
            </h2>
            <p>Nous collectons les donnees suivantes :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Donnees de compte</strong> : adresse email, nom, role
                (artiste ou booker), nom d&apos;agence
              </li>
              <li>
                <strong>Donnees d&apos;authentification</strong> : mot de passe
                (stocke sous forme hashee), token Google OAuth
              </li>
              <li>
                <strong>Donnees de booking</strong> : dates, lieux, cachets,
                informations de transport et d&apos;hotel, contacts promoteurs
              </li>
              <li>
                <strong>Donnees de calendrier Google</strong> : acces en
                lecture/ecriture a votre Google Calendar si vous activez la
                synchronisation
              </li>
              <li>
                <strong>Fichiers</strong> : billets de transport telecharges
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Finalite du traitement
            </h2>
            <p>Vos donnees sont utilisees pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Creer et gerer votre compte utilisateur</li>
              <li>Gerer vos bookings et votre agenda d&apos;artiste ou de booker</li>
              <li>
                Synchroniser vos evenements avec Google Calendar (sur votre
                demande)
              </li>
              <li>Permettre la communication entre bookers, artistes et promoteurs via les formulaires d&apos;advancing</li>
              <li>Partager les informations de promoteurs au sein d&apos;une agence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Base legale
            </h2>
            <p>
              Le traitement de vos donnees repose sur votre{" "}
              <strong>consentement</strong> (creation de compte, activation de la
              synchronisation Google Calendar) et sur l&apos;
              <strong>execution du contrat</strong> (fourniture du service
              Gigflow).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Partage des donnees
            </h2>
            <p>Vos donnees peuvent etre partagees avec :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Google</strong> : dans le cadre de l&apos;authentification
                OAuth et de la synchronisation Google Calendar
              </li>
              <li>
                <strong>Les membres de votre agence</strong> : les bookers d&apos;une
                meme agence partagent les informations de promoteurs et de
                bookings
              </li>
              <li>
                <strong>Les promoteurs</strong> : via les formulaires d&apos;advancing
                (uniquement les champs que vous envoyez)
              </li>
            </ul>
            <p className="mt-2">
              Nous ne vendons jamais vos donnees a des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Hebergement et securite
            </h2>
            <p>
              L&apos;application est hebergee sur <strong>Vercel</strong> (frontend)
              et <strong>Railway</strong> (backend/base de donnees). Les donnees
              sont protegees par chiffrement HTTPS et authentification par token
              JWT.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Duree de conservation
            </h2>
            <p>
              Vos donnees sont conservees tant que votre compte est actif. En cas
              de suppression de compte, vos donnees personnelles seront
              supprimees dans un delai de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Vos droits
            </h2>
            <p>
              Conformement au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Droit d&apos;acces a vos donnees</li>
              <li>Droit de rectification</li>
              <li>Droit de suppression</li>
              <li>Droit a la portabilite</li>
              <li>Droit de retirer votre consentement (notamment pour Google Calendar)</li>
              <li>Droit d&apos;opposition</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous a{" "}
              <a
                href="mailto:contact@gigflow.online"
                className="text-purple-400 hover:underline"
              >
                contact@gigflow.online
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Cookies
            </h2>
            <p>
              Gigflow utilise uniquement des cookies techniques necessaires au
              fonctionnement du service (cookie d&apos;authentification JWT). Aucun
              cookie de tracking ou publicitaire n&apos;est utilise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Modifications
            </h2>
            <p>
              Cette politique peut etre mise a jour. En cas de modification
              substantielle, nous vous en informerons par email ou via
              l&apos;application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
