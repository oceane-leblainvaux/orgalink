-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Mar 17 Mars 2026 à 09:01
-- Version du serveur :  5.6.17
-- Version de PHP :  5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données :  `projet_m1`
--

-- --------------------------------------------------------

--
-- Structure de la table `acteur`
--

CREATE TABLE IF NOT EXISTS `acteur` (
  `id_acteur` int(11) NOT NULL AUTO_INCREMENT,
  `prenom` varchar(50) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `role_entreprise` varchar(50) DEFAULT NULL,
  `secteur` varchar(50) DEFAULT NULL,
  `nom` varchar(50) NOT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `extra_fields` text,
  PRIMARY KEY (`id_acteur`),
  KEY `fk_utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=67 ;

--
-- Contenu de la table `acteur`
--

INSERT INTO `acteur` (`id_acteur`, `prenom`, `age`, `role_entreprise`, `secteur`, `nom`, `id_utilisateur`, `extra_fields`) VALUES
(29, 'pk', 26, 'Patron', 'bureau', 'lok', 13, '[{"label":"xoxo","value":"xoxo"}]'),
(30, 'lek', 26, 'manage', 'financepro', 'kok', 14, NULL),
(32, 'lc', 63, 'chil', 'lio', 'new', 12, NULL),
(34, 'bhjv', 223, 'moa', 'com', 'kln', 14, NULL),
(36, 'lek', 21, 'manage', 'finance', 'ioi', 12, NULL),
(39, 'zsz', 23, 'manage', 'finance', 'szsz', 12, NULL),
(46, 'k', 5, 'o', 'm', 'l', 12, NULL),
(47, 'kll', 5, 'o', 'm', 'l', 14, NULL),
(48, 'ojk', 65, 'lop', 'pol', 'kok', 14, NULL),
(49, 'le', 35, 'manger', 'communication', 'pierre ', 13, '[{"label":"statut ","value":"Marie"}]'),
(51, 'retre', 52, 'manager', 'finance', 'lucas', 13, NULL),
(52, 'le', 36, 'CM', 'communication', 'eve', 13, NULL),
(53, 'ler', 37, 'respo', 'communication', 'tony', 13, NULL),
(54, 'po', 26, 'structurateur', 'finance', 'pool', 13, NULL),
(57, 'l', 65, 'lo', 'ras', 'l', 15, NULL),
(58, 'gregor', 65, 'structurateur', 'finance', 'kok', 13, NULL),
(59, 'gregorio', 42, 'audit interne', 'finance', 'pat', 13, NULL),
(60, 'Chef', 21, NULL, NULL, 'D''atelier', 16, NULL),
(61, 'Ouvrières', 26, 'Usine', 'Usine', 'de production', 16, NULL),
(62, 'Ingénieur', 0, 'Non défini', 'Non précisé', 'Technique', 16, '[{"label":"tov","value":"tov"}]'),
(63, 'Ouvrier ', 26, 'Usine', 'Usine', 'de maintenance', 16, '[{"label":"axdax","value":"azxa"}]'),
(65, 'Directeur', 0, 'Non défini', 'Non précisé', 'd''usine', 16, '[{"label":"sdsdq","value":"qdqqqqqqq"}]'),
(66, 'l', NULL, NULL, NULL, 'lucas', 16, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `historique_actions`
--

CREATE TABLE IF NOT EXISTS `historique_actions` (
  `id_historique` int(11) NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int(11) NOT NULL,
  `date_action` datetime DEFAULT CURRENT_TIMESTAMP,
  `type_action` enum('ajout','modification','suppression') NOT NULL,
  `cle_etrangere` int(11) NOT NULL,
  `type_cle` enum('acteur','relation_hierarchique','relation_informelle','schema') NOT NULL,
  `id_acteur_source` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_historique`),
  KEY `id_utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `relation_hierarchique`
--

CREATE TABLE IF NOT EXISTS `relation_hierarchique` (
  `id_relation_hierarchique` int(11) NOT NULL AUTO_INCREMENT,
  `id_acteur_source` int(11) NOT NULL,
  `id_acteur_superieur` int(11) DEFAULT NULL,
  `type_relation` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_relation_hierarchique`),
  KEY `id_acteur_source` (`id_acteur_source`),
  KEY `id_acteur_superieur` (`id_acteur_superieur`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=41 ;

--
-- Contenu de la table `relation_hierarchique`
--

INSERT INTO `relation_hierarchique` (`id_relation_hierarchique`, `id_acteur_source`, `id_acteur_superieur`, `type_relation`, `active`, `date_creation`) VALUES
(21, 30, 34, '', 1, '2025-03-27 16:38:47'),
(22, 36, 32, '', 1, '2025-03-27 16:53:18'),
(23, 32, NULL, '', 1, '2025-03-27 17:08:52'),
(24, 46, 39, '', 1, '2025-03-27 17:59:04'),
(25, 47, 30, '', 1, '2025-03-27 18:10:51'),
(26, 48, 30, '', 1, '2025-03-27 18:11:14'),
(27, 49, 29, '', 1, '2025-03-28 09:39:52'),
(29, 29, NULL, '', 1, '2025-03-28 09:40:26'),
(30, 51, 29, '', 1, '2025-03-28 09:41:01'),
(31, 52, 49, '', 1, '2025-03-28 09:42:21'),
(32, 53, 49, '', 1, '2025-03-28 09:42:49'),
(33, 54, 51, '', 1, '2025-03-28 09:43:22'),
(35, 58, 51, '', 1, '2025-04-09 10:18:54'),
(36, 59, 51, '', 1, '2025-04-09 10:19:17'),
(37, 61, 60, '', 1, '2025-04-23 14:52:25'),
(38, 63, 62, '', 1, '2025-04-23 14:53:27'),
(39, 60, 65, '', 1, '2025-04-23 14:54:28'),
(40, 62, 65, '', 1, '2025-04-23 14:55:34');

-- --------------------------------------------------------

--
-- Structure de la table `relation_informelle`
--

CREATE TABLE IF NOT EXISTS `relation_informelle` (
  `id_relation_informelle` int(11) NOT NULL AUTO_INCREMENT,
  `id_acteur_source` int(11) NOT NULL,
  `id_acteur_cible` int(11) NOT NULL,
  `type_relation` varchar(255) NOT NULL,
  `direction_relation` enum('Simple','Double') NOT NULL,
  `impact_source_vers_cible` enum('Faible','Moyen','Fort') NOT NULL,
  `impact_cible_vers_source` enum('Faible','Moyen','Fort') NOT NULL,
  `nature_relation` enum('Positive','Négative','Neutre') NOT NULL,
  `duree_relation` varchar(255) DEFAULT NULL,
  `id_utilisateur` int(11) NOT NULL,
  PRIMARY KEY (`id_relation_informelle`),
  KEY `id_acteur_source` (`id_acteur_source`),
  KEY `id_acteur_cible` (`id_acteur_cible`),
  KEY `id_utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=110 ;

--
-- Contenu de la table `relation_informelle`
--

INSERT INTO `relation_informelle` (`id_relation_informelle`, `id_acteur_source`, `id_acteur_cible`, `type_relation`, `direction_relation`, `impact_source_vers_cible`, `impact_cible_vers_source`, `nature_relation`, `duree_relation`, `id_utilisateur`) VALUES
(97, 49, 51, 'Relation', 'Simple', 'Moyen', 'Moyen', 'Neutre', '0', 13),
(99, 51, 53, 'pouvoir', 'Simple', 'Faible', 'Moyen', 'Négative', '6', 13),
(101, 51, 59, 'Relation', 'Simple', 'Moyen', 'Moyen', 'Neutre', '0', 13),
(102, 49, 54, 'Relation', 'Simple', 'Fort', 'Moyen', 'Positive', '6', 13),
(103, 51, 29, 'Mentorat', 'Double', 'Fort', 'Faible', 'Positive', '0', 13),
(104, 51, 58, 'Dépendance', 'Simple', 'Fort', 'Moyen', 'Négative', '0', 13),
(105, 49, 53, 'Dépendance', 'Double', 'Moyen', 'Moyen', 'Neutre', '0', 13),
(108, 54, 58, 'dep', 'Double', 'Moyen', 'Fort', 'Neutre', '54', 13),
(109, 53, 54, 'xxxooxxoo', 'Simple', 'Moyen', 'Moyen', 'Neutre', '0', 13);

-- --------------------------------------------------------

--
-- Structure de la table `schema_table`
--

CREATE TABLE IF NOT EXISTS `schema_table` (
  `id_schema` int(11) NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `type_schema` enum('hierarchique','informelle','comparatif') NOT NULL,
  `date_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `actif` tinyint(1) DEFAULT '1',
  `nom_fichier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_schema`),
  KEY `id_utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=74 ;

--
-- Contenu de la table `schema_table`
--

INSERT INTO `schema_table` (`id_schema`, `id_utilisateur`, `nom`, `type_schema`, `date_time`, `actif`, `nom_fichier`) VALUES
(21, 12, 'Clement_Le Coz_1742562870', 'hierarchique', '2025-03-21 14:14:30', 1, NULL),
(24, 12, 'Clement_Le_Coz_1742564867', 'hierarchique', '2025-03-21 14:47:47', 1, NULL),
(26, 13, 'pol_bre_1742565108', 'hierarchique', '2025-03-21 14:51:48', 1, NULL),
(27, 12, 'Clement_Le_Coz_1743095343', 'hierarchique', '2025-03-27 18:09:03', 1, NULL),
(28, 14, 'to_yo_1743095487', 'hierarchique', '2025-03-27 18:11:27', 1, NULL),
(31, 14, 'to_yo_1743150200', 'hierarchique', '2025-03-28 09:23:20', 1, NULL),
(33, 13, 'pol_bre_1743151471', 'hierarchique', '2025-03-28 09:44:31', 1, NULL),
(41, 13, 'pol_bre_1743170573', 'hierarchique', '2025-03-28 15:02:53', 1, NULL),
(47, 15, 'celem_lec_1743172541', 'hierarchique', '2025-03-28 15:35:41', 1, NULL),
(49, 13, 'pol_bre_1743172954', 'hierarchique', '2025-03-28 15:42:34', 1, NULL),
(51, 13, 'pol_bre_1743248996', 'hierarchique', '2025-03-29 12:49:56', 1, NULL),
(52, 13, 'pol_bre_1743412766', 'hierarchique', '2025-03-31 11:19:27', 1, NULL),
(53, 13, 'pol_bre_1743423079', 'hierarchique', '2025-03-31 14:11:19', 1, NULL),
(54, 15, 'celem_lec_1743423092', 'hierarchique', '2025-03-31 14:11:32', 1, NULL),
(55, 13, 'pol_bre_1743423434', 'hierarchique', '2025-03-31 14:17:14', 1, NULL),
(56, 13, 'pol_bre_1743682754', 'hierarchique', '2025-04-03 14:19:14', 1, NULL),
(57, 13, 'pol_bre_1743683069', 'hierarchique', '2025-04-03 14:24:29', 1, NULL),
(58, 13, 'pol_bre_1744096128', 'hierarchique', '2025-04-08 09:08:48', 1, NULL),
(59, 13, 'pol_bre_1744190120', 'hierarchique', '2025-04-09 11:15:20', 1, NULL),
(60, 13, 'graphe_informel_1744796935333', 'informelle', '2025-04-16 11:48:57', 1, NULL),
(61, 13, 'graphe_informel_1744798248629', 'informelle', '2025-04-16 12:10:50', 1, 'pol_bre_1744798250.png'),
(64, 13, 'graphe_informel_1744798935991', 'informelle', '2025-04-16 12:22:18', 1, 'graphe_informel_1744798935991.png'),
(65, 13, 'organigramme_1744799750356', 'hierarchique', '2025-04-16 12:35:52', 1, 'organigramme_1744799750356.png'),
(66, 13, 'graphe_informel_1744805262370', 'informelle', '2025-04-16 14:07:44', 1, 'graphe_informel_1744805262370.png'),
(67, 13, 'graphe_informel_1744805263642', 'informelle', '2025-04-16 14:07:45', 1, 'graphe_informel_1744805263642.png'),
(68, 13, 'graphe_informel_1744805264131', 'informelle', '2025-04-16 14:07:46', 1, 'graphe_informel_1744805264131.png'),
(69, 13, 'graphe_informel_1745401809965', 'informelle', '2025-04-23 11:50:12', 1, 'graphe_informel_1745401809965.png'),
(70, 13, 'graphe_informel_1745829837155', 'informelle', '2025-04-28 10:43:59', 1, 'graphe_informel_1745829837155.png'),
(71, 16, 'organigramme_1745847873584', 'hierarchique', '2025-04-28 15:44:35', 1, 'organigramme_1745847873584.png'),
(72, 16, 'graphe_informel_1745848731020', 'informelle', '2025-04-28 15:58:53', 1, 'graphe_informel_1745848731020.png'),
(73, 13, 'graphe_informel_1745911749463', 'informelle', '2025-04-29 09:29:11', 1, 'graphe_informel_1745911749463.png');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_utilisateur` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` text NOT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `prenom` varchar(50) DEFAULT NULL,
  `role` enum('eleve','prof') NOT NULL DEFAULT 'eleve',
  PRIMARY KEY (`id_utilisateur`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=17 ;

--
-- Contenu de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id_utilisateur`, `email`, `mot_de_passe`, `nom`, `prenom`, `role`) VALUES
(1, 'jean.dupont@example.com', 'test123', 'Jean Dupont', '', 'eleve'),
(2, 'ronan.laure@orange.fr', '$2y$10$Q4bVSMAAY3gBRtu.Y1oiU.Y25ocyyJa4FIxzAZgqqIE4n2ieDYt5S', '', '', 'eleve'),
(3, 'eff@ded.de', '$2y$10$UnbNj0q4Q0vnR.P7KdXZqOaCa6KHQGZSVW3S5o4wZz4DyVOzli4Ii', NULL, NULL, 'eleve'),
(4, 'svrv@d.r', '$2y$10$yeJgr62zEf9ZWeeiOmsxVOFV5E9fND9Cz847UXtyQAPpov7xBISF2', NULL, NULL, 'eleve'),
(5, 'fref@fr.rf', '$2y$10$aQSIxe66f1aP2UVMsUN2L.tdxkHEOi.PIFTqt2O7YiFpuLrKeVMYq', NULL, NULL, 'eleve'),
(6, 'jgb@ok.i', 'guib', 'uigb', 'vh', 'eleve'),
(7, 'ljj@k.l', 'biji', 'jn', 'uhb', 'eleve'),
(11, 'ljj@k.lilou', '$2y$10$OOeSqd3MDyJ5uYtOilGBkuK7SbQaCHi43za6CW6nYg64JVvMTURrW', 'jnven1', 'uhb', 'eleve'),
(12, 'lecoz.clementlosc@laposte.net', '$2y$10$IzPt3Bjb/cvh6LFL0/Yb4.c.ORfS5BuMwSwfm9NT9Tjdh3Ssw966S', 'Le Coz', 'Clement', 'eleve'),
(13, 'clement.le-coz@isen-ouest.yncrea.fr', '$2y$10$BuVXnrxq6Fpop.0nHpaitudS2sgjku6bba0j8aJnesocLcssAdMje', 'bre', 'pol', 'eleve'),
(14, 'to.yo@pas.une', '$2y$10$.wE/6UIIwQWTPXO/nYFr1.Cxtk3MsBPHSIXI7QCneY91PBdUjbYby', 'yo', 'to', 'eleve'),
(15, 'po@po.net', '$2y$10$I/1ueFsPQcZerZ/lMNo/De5ITd06X6pVU9nPTfmWEnDLGeq7PpoGu', 'lec', 'celem', 'prof'),
(16, 'lo.lou@lapo.net', '$2y$10$TCot4V1QZBtbHO8VTnAh4OKWTtgD4H5BjYWyF4VVXqAbnLiEd6O0m', 'lou', 'lola', 'eleve');

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `acteur`
--
ALTER TABLE `acteur`
  ADD CONSTRAINT `fk_utilisateur` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`);

--
-- Contraintes pour la table `historique_actions`
--
ALTER TABLE `historique_actions`
  ADD CONSTRAINT `historique_actions_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `relation_hierarchique`
--
ALTER TABLE `relation_hierarchique`
  ADD CONSTRAINT `relation_hierarchique_ibfk_1` FOREIGN KEY (`id_acteur_source`) REFERENCES `acteur` (`id_acteur`) ON DELETE CASCADE,
  ADD CONSTRAINT `relation_hierarchique_ibfk_2` FOREIGN KEY (`id_acteur_superieur`) REFERENCES `acteur` (`id_acteur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `relation_informelle`
--
ALTER TABLE `relation_informelle`
  ADD CONSTRAINT `relation_informelle_ibfk_1` FOREIGN KEY (`id_acteur_source`) REFERENCES `acteur` (`id_acteur`) ON DELETE CASCADE,
  ADD CONSTRAINT `relation_informelle_ibfk_2` FOREIGN KEY (`id_acteur_cible`) REFERENCES `acteur` (`id_acteur`) ON DELETE CASCADE,
  ADD CONSTRAINT `relation_informelle_ibfk_3` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`);

--
-- Contraintes pour la table `schema_table`
--
ALTER TABLE `schema_table`
  ADD CONSTRAINT `schema_table_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
