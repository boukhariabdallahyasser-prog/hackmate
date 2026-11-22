-- Local development only. Use separately vetted domains in hosted environments.
insert into public.universities(id,name,slug,city)
values('656faf42-c200-4039-b609-e6c7ffb3d99e','HackMate Test University','hackmate-test-university','Algiers')
on conflict do nothing;
insert into public.university_email_domains(university_id,domain)
values('656faf42-c200-4039-b609-e6c7ffb3d99e','campus.test')
on conflict do nothing;
insert into public.skills(name) values ('TypeScript'),('Python'),('Data analysis'),('Product design'),('Robotics'),('Embedded systems')
on conflict do nothing;
insert into public.interests(name) values ('Open source'),('Education'),('Artificial intelligence'),('Climate technology'),('Entrepreneurship')
on conflict do nothing;
