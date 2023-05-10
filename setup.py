from setuptools import setup, find_namespace_packages
from setup_helper import find_all_resource_files

# -- Apps Definition -- #
namespace = 'tethysapp'
app_package = "ggst"
release_package = "tethysapp-" + app_package

# -- Python Dependencies -- #
dependencies = []

# -- Get Resource File -- #
resource_files = find_all_resource_files(app_package, namespace)


setup(
    name=release_package,
    version="0.0.1",
    description="Visualize and subset Grace data",
    long_description="Visualize and subset Grace data",
    keywords="replace_keywords",
    author="Sarva Pulla",
    author_email="Sarva Pulla_email",
    url="",
    license="MIT",
    packages=find_namespace_packages(),
    package_data={"": resource_files},
    include_package_data=True,
    zip_safe=False,
    install_requires=dependencies,
)
