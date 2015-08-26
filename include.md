---
title: ESB Include
layout: default
---

<div class="docs-container">
	<div class="page-header">
		<h1>Include</h1>
	</div>
	<div class="row">
		<div class="col-md-9">
			<p class="lead">
				Dynamically inject a component's HTML and its associated CSS and JS in page layouts.
			</p>
			<h2>Features</h2>
			<ul>
				<li>
					<strong>Asynchronous Loading</strong> Components are loaded asynchronously so other parts of your prototype can load without being blocked
				</li>
				<li>
					<strong>Nestability</strong> Components can be infinitely nested
				</li>
				<li>
					<strong>Content Variables</strong> Variables can be passed into components on an instance by instance basis allowing the consistency of a reusable component to be paired with the flexibility of context-specific content.
				</li>
			</ul>
			<hr>
			
			<h2>Getting Started Tutorial</h2>
			<h3>1. Add Blocks to your project</h3>
			{% include getting_started_content.html %}
			
			<h3>2. Project Structure</h3>
			<p>Assume this simple project structure for the rest of the tutorial</p>
			<h6 class="code-filename-header">Project Directory</h6>
			<pre>
<code>includes/
esb.min.js
esb.min.css
my_prototype.html</code></pre>
		
			<h6 class="code-filename-header">my_prototype.html</h6>
			<pre class="language-markup">
<code>&lt;html&gt;
    &lt;head&gt;
        &lt;link rel=&quot;stylesheet&quot; href=&quot;esb.min.css&quot;/&gt;
        &lt;script src=&quot;esb.min.js&quot;&gt;&lt;/script&gt;
    &lt;/head&gt;
    &lt;body&gt;
        &lt;!-- We&#039;ll add the include calls here --&gt;
    &lt;/body&gt;
&lt;/html&gt;</code></pre>

			
			<h3>3. Create an include</h3>
			<p>Within the <code>/includes</code> folder create a new file called <code>call-to-action.html</code></p>
			<h6 class="code-filename-header">Project Directory</h6>
			<pre>
<code>includes/
    call-to-action.html
esb.min.js
esb.min.css
my_prototype.html</code></pre>

			<h4>Create include markup</h4>
			<p>Within the include file you can define different variations of an include. What constitutes a "variation" is completely up to you, but for our purposes we're going to create a "default" call-to-action and a "secondary" call-to-action.</p>
			<p>Within <code>call-to-action.html</code> add the following:</p>
			<h6 class="code-filename-header">call-to-action.html</h6>
			<pre class="language-markup">
<code>&lt;section data-esb-variation=&quot;default&quot;&gt;
    &lt;div class=&quot;call-to-action&quot;&gt;
        &lt;img class= &quot;call-to-action-image&quot; src=&quot;http://placehold.it/242x200&quot; alt=&quot;cta image&quot;&gt;
        &lt;div class=&quot;call-to-action-copy-wrap&quot;&gt;
            &lt;h1 class=&quot;call-to-action-header&quot;&gt;Look at this amazing offer!&lt;/h1&gt;
            &lt;p class=&quot;call-to-action-body&quot;&gt;Time&#039;s running out. Act fast to make it yours.&lt;/p&gt;
            &lt;a href=&quot;#link&quot; class=&quot;call-to-action-button&quot;&gt;Buy Now!&lt;/a&gt;
        &lt;/div&gt;
    &lt;/div&gt;
&lt;/section&gt;

&lt;section data-esb-variation=&quot;secondary&quot;&gt;
    &lt;div class=&quot;call-to-action secondary-call-to-action&quot;&gt;
        &lt;h1 class=&quot;call-to-action-header&quot;&gt;This offer&#039;s good too!&lt;/h1&gt;
        &lt;a href=&quot;#link&quot; class=&quot;call-to-action-button&quot;&gt;Buy Now!&lt;/a&gt;
    &lt;/div&gt;
&lt;/section&gt;</code></pre>

			<h3>4. Add Include Snippets</h3>
			<p>
				Update <code>my_prototype.html</code> with include snippets. Include snippets are simply HTML elements with specific <code>data-</code> attributes that tell Blocks where to inject your include. In this example we're using <code>&lt;div&gt;</code>'s but you can use any HTML element, it's the <code>data-</code> attributes that are the important part.
			</p>

						<h6 class="code-filename-header">my_prototype.html</h6>
<pre class="language-markup" data-line="7,8">
<code>&lt;html&gt;
    &lt;head&gt;
        &lt;link rel=&quot;stylesheet&quot; href=&quot;esb.min.css&quot;/&gt;
        &lt;script src=&quot;esb.min.js&quot;&gt;&lt;/script&gt;
    &lt;/head&gt;
    &lt;body&gt;
		&lt;div data-esb-include=&quot;call-to-action&quot;&gt;&lt;/div&gt;
		&lt;div data-esb-include=&quot;call-to-action&quot; data-esb-variation=&quot;secondary&quot;&gt;&lt;/div&gt;
    &lt;/body&gt;
&lt;/html&gt;</code></pre>

		</div>
		<div class="col-md-3">
			<div class="list-group">
			  <a href="#getting-started" class="list-group-item active">
			    Getting Started
			  </a>
			  <a href="#" class="list-group-item">Dapibus ac facilisis in</a>
			  <a href="#" class="list-group-item">Morbi leo risus</a>
			  <a href="#" class="list-group-item">Porta ac consectetur ac</a>
			  <a href="#" class="list-group-item">Vestibulum at eros</a>
			</div>
		</div>
	</div>
</div>