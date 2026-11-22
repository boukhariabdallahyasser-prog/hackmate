-- Run after applying migrations to the intended HackMate environment.
begin;

insert into public.universities (name, slug, city)
values ('National School of Artificial Intelligence', 'ensia', 'Sidi Abdellah, Algiers')
on conflict (slug) do nothing;

insert into public.university_email_domains (university_id, domain)
select id, 'ensia.edu.dz' from public.universities where slug = 'ensia'
on conflict (domain) do nothing;

do $$
begin
  if not exists (
    select 1
    from public.university_email_domains as domain
    join public.universities as university on university.id = domain.university_id
    where domain.domain = 'ensia.edu.dz'
      and university.slug = 'ensia'
      and domain.active
      and university.active
  ) then
    raise exception 'Review the existing ENSIA university and domain configuration before enabling signup';
  end if;
end
$$;

commit;
