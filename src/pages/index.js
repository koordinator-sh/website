import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';
import GitHubButton from 'react-github-btn';
import features from '../components/features';
import styles from './index.module.css';

function Feature({Svg, title, description, reverse}) {
  return (
    <div className={clsx('row', styles.feature, reverse ? styles.featureReverse : '')}>
      <div className="col col--3">
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
      </div>
      <div className={clsx('col col--9', styles.featureDesc)}>
        <div>
          <h2>{title}</h2>
          <div>{description}</div>
        </div>
      </div>
    </div>
  );
}

const Button = ({ children, href }) => {
  return (
    <div className="col col--2 margin-horiz--sm">
      <Link
        className="button button--outline button--primary button--lg"
        to={href}>
        {children}
      </Link>
    </div>
  );
};

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.hero)}>
      <div className="container text--center">
        <div className={styles.heroLogoWrapper}>
          <img className={styles.heroLogo} src={useBaseUrl('img/logo.svg')} alt="Koordinator Logo" />
        </div>
        <h1 className="hero__title">{siteConfig.title}</h1>
        <GitHubButton
            href="https://github.com/koordinator-sh/koordinator"
            data-icon="octicon-star"
            data-size="large"
            data-show-count="true"
            aria-label="Star facebook/metro on GitHub">
            Star
          </GitHubButton>
        <p className="hero__subtitle"><Translate>{siteConfig.tagline}</Translate></p>

        <div
            className={clsx(styles.heroButtons, 'name', 'margin-vert--md')}>
            <Button href={useBaseUrl('docs/installation')}><Translate>Getting Started</Translate> </Button>
            <Button href={useBaseUrl('docs/')}><Translate>Learn More</Translate></Button>
         </div>
         
      </div>
    </header>

  );
}


export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`QoS based scheduling system`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      
      <WhatIs />

      <main className={clsx('hero', styles.hero)}>
        <div className="container">
          <section className={styles.features}>
            <div className="container">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}



const WhatIs = () => (
  <div className={clsx('hero', styles.hero)}>
    <div className="container">
      <div className="row">
        <div className="col col--6">
          <h1><Translate>What is Koordinator?</Translate></h1>
          <p className="hero__subtitle">
            <small>
              <Translate>
                Koordinator is a modern scheduling system that colocate different types of workloads on kubernetes. 
                It achieves high utilization by combining elastic resource quota, efficient pod-packing, over-commitment, and node sharing with container resource isolation.
              </Translate>
              <br />
              <br />
              <Translate>
                Koordinator is high performance, scalable, yet most importantly,
              </Translate><i><b> <Translate>proven in mass production environments.</Translate></b></i>
              <Translate> It allows you to build container orchestration systems that support enterprise production environments.</Translate>
            </small>
          </p>
        </div>
        <div className="col">
          <img
            className="image"
            src={useBaseUrl("img/what-is-koordinator.svg")}
            align="right"
            alt="what is koordinator"
          />
        </div>
      </div>
    </div>
  </div >
);
