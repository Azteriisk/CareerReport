fetch('http://localhost:3000')
  .then(res => res.text())
  .then(html => {
    const matches = html.match(/<(meta|title)[^>]*>/g);
    console.log(matches ? matches.join('\n') : 'No meta tags');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
