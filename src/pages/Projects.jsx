import { useState } from 'react';
import PageHero from '../components/ui/PageHero';
import ProjectFilter from '../components/projects/ProjectFilter';
import ProjectGrid from '../components/projects/ProjectGrid';
import StatsSection from '../components/home/StatsSection';
import CtaBand from '../components/ui/CtaBand';
import { getProjectsByCategory } from '../data/projects';

export default function Projects() {
  const [category, setCategory] = useState('all');
  const visible = getProjectsByCategory(category);

  return (
    <>
      <PageHero
        eyebrow="OUR WORK"
        title="PROJECTS"
        text="Residential, commercial, interior, civil and turnkey projects delivered by our team."
        image="/assets/projects/luxury-bungalow.svg"
        breadcrumbs={[{ label: 'Projects' }]}
      />

      <section className="section">
        <div className="container">
          <ProjectFilter active={category} onChange={setCategory} />
          <ProjectGrid projects={visible} />
        </div>
      </section>

      <StatsSection />
      <CtaBand
        title="WANT A PROJECT LIKE THIS?"
        text="Send us your requirement and we will prepare a quotation for your site."
      />
    </>
  );
}
